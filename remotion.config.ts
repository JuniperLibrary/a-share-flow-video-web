import { Config } from '@remotion/cli/config';
import path from 'path';

// process.cwd() is set to remotionRoot before config eval runs
const projectRoot = process.cwd();

Config.overrideWebpackConfig((currentConfiguration) => {
  return {
    ...currentConfiguration,
    resolve: {
      ...currentConfiguration.resolve,
      alias: {
        ...currentConfiguration.resolve.alias,
        '@': path.resolve(projectRoot, 'src'),
      },
    },
  };
});
