import { PrismaClient } from '@prisma/client'
import { collections } from '../mint'
const prisma = new PrismaClient()


async function main() {
    console.log(`Start seeding ...`)
    for (const c of collections) {
        const newCol = await prisma.collection.create({
            data: {
                collectionName: c.collectionName
            }
        })
        console.log(`Created collection : ${newCol.collectionName}`)
    }
    console.log(`Seeding finished.`)
}


main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })