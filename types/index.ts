export type Example = {
    pictureSrc: string
}

export type MintItemProps = {
    author: string
    name: string
    collectionName: string
    description: { line1: string, line2: string, line3: string },
    examples: { example1: Example, example2: Example }
    left: boolean
    metadata: object
}