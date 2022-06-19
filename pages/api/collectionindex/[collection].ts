import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const { collection } = req.query;

    const collectionName = collection.toString()

    const dbCollection = await prisma.collection.findUnique({
        where: {
            collectionName: collectionName
        }
    })

    if (!dbCollection) return res.status(200).json({ error: 'We couldnt find this collection to get id' })
    const expTime = addHours(new Date(), 1)

    const expiredReservation = await prisma.collectionIndexes.findFirst({
        where: {
            AND: [
                {
                    reservedAt: {
                        gte: expTime
                    }
                },
                {
                    submitedTx: undefined
                }
            ]
        },
        orderBy: {
            reservedAt: 'desc'
        }
    })
    let nftIndex: number = 1

    if (expiredReservation) {
        nftIndex = expiredReservation.reservedIndex
    } else {
        const highestReservedIndex = await prisma.collectionIndexes.findFirst({
            orderBy: {
                reservedIndex: 'desc'
            }
        })

        if (highestReservedIndex) {
            nftIndex = highestReservedIndex.reservedIndex + 1
        }
    }

    await prisma.collectionIndexes.create({
        data: {
            reservedIndex: nftIndex,
            collectionId: dbCollection.id
        }
    })
    return res.status(200).json({ nftIndex: nftIndex })
}

const addHours = function (date: Date, hours: number) {
    date.setTime(date.getTime() + (hours * 60 * 60 * 1000))
    return date;
}