import { Command } from 'commander'
import { loadConfig, saveConfig } from '../config'

export function registerConfigCommand(program: Command): void {
  program
    .command('config')
    .description('Configure SmartCloud CLI settings')
    .option('--base-url <url>', 'Set the SmartCloud server URL')
    .option('--default-project <id>', 'Set the default project ID')
    .action((options: { baseUrl?: string; defaultProject?: string }) => {
      const config = loadConfig()

      if (options.baseUrl) {
        config.base_url = options.baseUrl.replace(/\/+$/, '')
      }
      if (options.defaultProject) {
        config.default_project = options.defaultProject
      }

      if (!options.baseUrl && !options.defaultProject) {
        // Display current config
        console.log('Current configuration:')
        console.log(`  base_url: ${config.base_url || '(not set)'}`)
        console.log(`  default_project: ${config.default_project || '(not set)'}`)
        return
      }

      saveConfig(config)
      console.log('Configuration saved to ~/.smartcloud/config.json')
    })
}
