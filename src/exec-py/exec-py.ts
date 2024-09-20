import cp from 'child_process'
import logger from '../utils/formatLogs'

export const execPy = (nameOfFile: string, args: string[]) => {
    try {
        const execRes = cp.execSync(`python3 ${nameOfFile}.py ${args}`)
        logger(`stdout: ${execRes.toString()}`)
    } catch (error) {
        logger(`Error running python build-mode.py: ${error}`, 'error')
        logger(`stderr: ${(error as any)?.stderr?.toString()}`, 'error')
    }
}