import { DeployContext, getHomePath } from '@malagu/cli';
import { CodeLoader, CodeUri, FaaSAdapterConfiguration } from './faas-protocol';
import { readdirSync, statSync, readFileSync, existsSync } from 'fs-extra';
import * as JSZip from 'jszip';
import { join, resolve } from 'path';
const chalk = require('chalk');

export class DefaultCodeLoader implements CodeLoader {
    async load(ctx: DeployContext, config: FaaSAdapterConfiguration): Promise<JSZip> {
        const { pkg } = ctx;
        let codeDir = getHomePath(pkg);
        if (!existsSync(codeDir)) {
            console.log(chalk`{yellow Please build app first with "malagu build"}`);
            throw Error('Please build app first with "malagu build"');
        }
        let codeUri = config.function.codeUri;

        const zip = new JSZip();
        if (typeof codeUri === 'string') {
            codeUri = { value: codeUri };
        }
        if (codeUri?.value) {
            codeDir = resolve(codeDir, codeUri.value);
        }
        await this.doLoad(codeDir, zip, codeUri);
        return zip;
    }

    protected async doLoad(codeDir: string, zip: JSZip, codeUri?: CodeUri) {
        const files = readdirSync(codeDir);
        for (const fileName of files) {
            const fullPath = join(codeDir, fileName);
            if (!codeUri?.include || !this.match(codeUri.include, fullPath)) {
                if (codeUri?.exclude && this.match(codeUri.exclude, fullPath)) {
                    return;
                }
            }

            const file = statSync(fullPath);
            if (file.isDirectory()) {
                const dir = zip.folder(fileName);
                if (dir) {
                    await this.doLoad(fullPath, dir, codeUri);
                }
            } else {
                zip.file(fileName, readFileSync(fullPath), {
                    unixPermissions: '755'
                });
            }
        }
    }

    protected match(pattern: string | RegExp, fullPath: string) {
        const regx = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
        return regx.test(fullPath);
    }

}
