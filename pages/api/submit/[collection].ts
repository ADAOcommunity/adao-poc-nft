// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { C } from "lucid-cardano"
import initializeLucid from "../../../utils/lucid"
import { Collection, PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

import { NextApiRequest, NextApiResponse } from "next"
import Bottleneck from 'bottleneck'

import { decodeTx } from "../../../utils/transactionDecode"
import { Assets } from "lucid-cardano"
import mintinfo from "../../../mint"

const beWalletAddr = process.env.WALLET_ADDRESS

const limiter = new Bottleneck({
  maxConcurrent: 1
})

type SubmitReqBody = {
  txHex: string
  signatureHex: string
}


export default async (req: NextApiRequest, res: NextApiResponse) => {
  const submitReqBody: SubmitReqBody = req.body
  // console.log(req.body)
  if (!submitReqBody || !submitReqBody.txHex || !submitReqBody.signatureHex) return res.status(400).json({ error: `correct request body not provided` })

  const { collection } = req.query;

  const collectionName = collection.toString()

  const dbCollection = await prisma.collection.findUnique({
    where: {
      collectionName: collectionName
    }
  })

  if (!dbCollection) return res.status(200).json({ error: 'We couldnt find requestion collection to validate the transaction' })

  const transactionHex = submitReqBody.txHex.toString()

  const signatureHex = submitReqBody.signatureHex.toString()

  return res.status(200).json(
    await limiter.schedule(() => submitJob(transactionHex, signatureHex, dbCollection))
  )
}

const submitJob = async (transactionHex: string, signatureHex: string, collection: Collection) => {

  const transaction = C.Transaction.from_bytes(Buffer.from(transactionHex, 'hex'))

  const signatureSet = C.TransactionWitnessSet.from_bytes(Buffer.from(signatureHex, 'hex'))
  const signatureList = signatureSet.vkeys()

  if (!signatureList) return { error: "Signature invalid" }
  console.log("We've made it this far.")

  let { serverAdrrInputValue, otherInputValue, outputValueToServerAddr, outputValueToOtherAddr, serverAdrrInputHashes } = await decodeTx(transaction, beWalletAddr)

  const isValid = await validateTx(serverAdrrInputValue, outputValueToServerAddr, outputValueToOtherAddr, serverAdrrInputHashes, collection)
  if (!isValid) {
    return { error: "Transaction invalid" }
  }

  const transaction_body = transaction.body()

  const txBodyHash = C.hash_transaction(transaction_body)

  const serverKey = process.env.SERVER_PRIVATE_KEY

  const sKey = C.PrivateKey.from_extended_bytes(Buffer.from(serverKey, 'hex'))

  const witness = C.make_vkey_witness(
    txBodyHash,
    sKey
  );

  signatureList.add(witness);
  signatureSet.set_vkeys(signatureList);
  if (transaction.witness_set()?.native_scripts()) signatureSet.set_native_scripts(transaction.witness_set().native_scripts())

  let aux = C.AuxiliaryData.new()
  if (transaction.auxiliary_data()) aux = transaction.auxiliary_data()
  const signedTx = C.Transaction.new(transaction.body(), signatureSet, aux)
  const lib = await initializeLucid(null)
  let resS = null
  try {
    resS = await lib.provider.submitTx(signedTx)
  }
  catch (exc) {
    const errMsg = exc.info || exc.message || exc || ''
    return { error: errMsg }
  }

  // //if response looks like txHash, set used utxo as locked, set user as claimed
  if (!resS || resS.toString().length !== 64) {
    console.log('Submit res:')
    console.log(resS)
    return { error: resS }
  } else {

    // await addBusyNftIndex(nftIndex, resS.toString())
    return { txhash: resS.toString() }
  }
}

const validateTx: (
  serverAdrrInputValue: Assets,
  outputValueToServerAddr: Assets,
  outputValueToOtherAddr: Assets,
  serverAdrrInputHashes: string[],
  collection: Collection
) => Promise<boolean> = async (serverAdrrInputValue: Assets, outputValueToServerAddr: Assets, outputValueToOtherAddr: Assets, serverAdrrInputHashes: string[], collection: Collection) => {
  console.log(serverAdrrInputHashes)
  if (serverAdrrInputHashes && serverAdrrInputHashes.length > 0) return false

  const nftPrice = Number(mintinfo.nftAdaPrice)


  //GET NFT NAMES
  let nftNames = []
  let mintCount = BigInt(0)
  Object.keys(outputValueToOtherAddr).forEach(unit => {
    if (unit.startsWith(mintinfo.policyId)) {
      mintCount += BigInt(outputValueToOtherAddr[unit].toString())
      nftNames.push(
        Buffer.from(
          unit.replace(mintinfo.policyId, ''), 'hex'
        )
          .toString('ascii')
      )
    }
  })

  if (!nftNames || (mintCount < BigInt(nftNames.length))) {
    // console.log('Invalid mint request')
    // return false
    throw 'Invalid mint request'
  }

  //CHECK IF INDEX IN DB AND UNSUBMITTED

  let indexesToUpdateCount = 0

  nftNames.forEach(nftName => {
    const idMatches = nftName.match(/\d+$/)

    const nftId = idMatches[0];
    prisma.collectionIndexes.findMany({
      where: {
        AND: [
          { reservedIndex: nftId },
          { collectionId: collection.id }
        ]
      },
      orderBy: {
        reservedAt: 'asc'
      }
    }).then(
      cis => {
        const alreadySubmited = cis.filter(ci => ci.submitedTx !== undefined)
        if (alreadySubmited && alreadySubmited.length > 0) {
          var d = new Date()
          d.setHours(d.getHours() - 1)
          alreadySubmited.forEach(sCi => {
            if (sCi.reservedAt.getTime() > d.getTime()) throw 'Transaction with one of these NFTs was already submited.'
          })
        }
        const readyToSubmit = cis.filter(ci => ci.submitedTx === undefined)
        if(readyToSubmit && readyToSubmit.length > 0) indexesToUpdateCount += 1
        else {
          return false
        }
      }
    )
  })

  if(indexesToUpdateCount !== nftNames.length) return false

  //IF YES, CHECK ADDED LOVELACE TO SERVER ADDR
  const serverLovelaceInput = serverAdrrInputValue && serverAdrrInputValue['lovelace'] ? BigInt(serverAdrrInputValue['lovelace'].toString()) : BigInt(0)
  const serverLovelaceOutput = outputValueToServerAddr && outputValueToServerAddr['lovelace'] ? BigInt(outputValueToServerAddr['lovelace'].toString()) : BigInt(0)

  const serverLovelaceDiff = serverLovelaceOutput - serverLovelaceInput

  if(serverLovelaceDiff < BigInt(nftPrice * nftNames.length * 1000000)) return false

  return true
}



