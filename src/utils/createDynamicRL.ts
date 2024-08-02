import fs from 'fs'
import readline from 'readline'

export const createDynamicRL = (filePath: string, callbackLine: (line: string) => void, callbackClose: () => void) => {
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        output: process.stdout,
        terminal: false
    })

    rl.on("line", callbackLine)

    rl.on("close", callbackClose)

    return rl
}