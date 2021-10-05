
import { BACKEND_TARGET, CliContext, setProjectHomePath, getProjectHomePathForTarget } from '@malagu/cli-common';
import * as path from 'path';
import * as WebpackChain from 'webpack-chain';

export class OutputConfigFactory {
    create(config: WebpackChain, context: CliContext, target: string) {
        const { dev, output } = context;
        if (output) {
            setProjectHomePath(path.join(process.cwd(), output));
        }
        const outputPath = path.join(getProjectHomePathForTarget(target), 'dist');

        config.output.path(outputPath);

        if (BACKEND_TARGET === target) {
            config
                .output
                    .filename('index.js')
                    .libraryTarget('umd')
                    .devtoolModuleFilenameTemplate(dev ? '[absolute-resource-path]' : undefined);
        } else {
            config
                .output
                    .filename('[name].[chunkhash].js');
        }
    }

    support(context: CliContext, target: string): boolean {
        return true;
    }
}
