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

    let expiredReservation = await prisma.collectionIndexes.findMany({
        where: {
            AND: [
                {
                    collectionId: dbCollection.id
                },
                {
                    submitedTx: null
                }
            ]
        },
        orderBy: {
            reservedAt: 'asc'
        }
    })
    let nftIndex: number = 1
    expiredReservation = expiredReservation.filter(r => addHours(r.reservedAt, 1).getTime() < new Date().getTime())
    if (expiredReservation && expiredReservation.length > 0) {
        const cis = await prisma.collectionIndexes.findMany({
            where: {
                reservedIndex: Number(expiredReservation[0].reservedIndex),
                collectionId: dbCollection.id
            },
            orderBy: {
                reservedAt: 'asc'
            }
        })
        const alreadySubmited = cis.filter(ci => ci.submitedTx !== undefined && ci.submitedTx !== null)
        if (alreadySubmited && alreadySubmited.length > 0) {
            nftIndex = undefined
        } else {
            nftIndex = expiredReservation[0].reservedIndex
        }
    } else {
        nftIndex = undefined
    }

    if (nftIndex === undefined) {
        const highestReservedIndex = await prisma.collectionIndexes.findFirst({
            where: {
                collectionId: dbCollection.id
            },
            orderBy: {
                reservedIndex: 'desc'
            }
        })
        if (highestReservedIndex) {
            nftIndex = highestReservedIndex.reservedIndex + 1
        } else {
            nftIndex = 1
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