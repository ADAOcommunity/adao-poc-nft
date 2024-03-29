import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from '@prisma/client'
import mint from "../../../mint";

const prisma = new PrismaClient()

export default async function (req: NextApiRequest, res: NextApiResponse) {
    const { collection } = req.query;
    const reservationTime = parseInt(mint.reservationTime);

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
                },
                {
                    reservedAt: {
                        lte: subtractMinutes(new Date(), reservationTime)
                    }
                }
            ]
        },
        orderBy: {
            reservedAt: 'asc'
        }
    })
    let nftIndex: number = 1
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
        const recentReserved = cis.filter(ci => ci.reservedAt > subtractMinutes(new Date(), reservationTime))
        if ((alreadySubmited && alreadySubmited.length > 0) || recentReserved.length > 0) {
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

    if (nftIndex > dbCollection.collectionLimit && dbCollection.collectionLimit != null) return res.status(200).json({ error: 'Out of stock' })

    await prisma.collectionIndexes.create({
        data: {
            reservedIndex: nftIndex,
            collectionId: dbCollection.id
        }
    })
    return res.status(200).json({ nftIndex: nftIndex })
}

const subtractMinutes = (date: Date, minutes: number) => {
    let offset = date.getTimezoneOffset()
    let newDate = new Date(Date.now() + offset)
    // newDate.setHours(date.getHours() - hours);
    newDate.setMinutes(date.getMinutes() - minutes)
    //date.setHours(date.getHours() - hours);
    return newDate;
    // return date;
}
