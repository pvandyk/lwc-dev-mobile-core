/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: MIT
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/MIT
 */
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Logger, Messages, SfdxError } from '@salesforce/core';
import util from 'util';
import { AndroidEnvironmentSetup } from '../../../../../common/AndroidEnvironmentSetup';
import { CommandLineUtils } from '../../../../../common/Common';
import { IOSEnvironmentSetup } from '../../../../../common/IOSEnvironmentSetup';
import { LoggerSetup } from '../../../../../common/LoggerSetup';
import {
    BaseSetup,
    Requirement,
    SetupTestResult
} from '../../../../../common/Requirements';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages(
    '@salesforce/lwc-dev-mobile-core',
    'setup'
);

export default class Setup extends SfdxCommand {
    public static description = messages.getMessage('commandDescription');

    public static readonly flagsConfig: FlagsConfig = {
        platform: flags.string({
            char: 'p',
            description: messages.getMessage('platformFlagDescription'),
            longDescription: messages.getMessage('platformFlagDescription'),
            required: true
        })
    };

    public examples = [
        `sfdx force:lightning:local:setup -p iOS`,
        `sfdx force:lightning:local:setup -p Android`
    ];

    private setupSteps: BaseSetup | undefined;

    public async run(): Promise<any> {
        if (!CommandLineUtils.platformFlagIsValid(this.flags.platform)) {
            return Promise.reject(
                new SfdxError(
                    messages.getMessage('error:invalidInputFlagsDescription'),
                    'lwc-dev-mobile-core',
                    this.examples
                )
            );
        }
        this.logger.info(`Setup Command called for ${this.flags.platform}`);
        return this.executeSetup(this.setup()).then((result) => {
            if (!result.hasMetAllRequirements) {
                return Promise.reject(
                    new SfdxError(
                        util.format(
                            messages.getMessage('error:setupFailed'),
                            this.flags.platform
                        ),
                        'lwc-dev-mobile-core',
                        [
                            messages.getMessage(
                                'error:setupFailed:recommendation'
                            )
                        ]
                    )
                );
            } else {
                return Promise.resolve(result);
            }
        });
    }

    public async executeSetup(setup: BaseSetup): Promise<SetupTestResult> {
        return setup.executeSetup();
    }

    protected async init(): Promise<void> {
        await super.init();
        const logger = await Logger.child('mobile:setup', {});
        this.logger = logger;
        await LoggerSetup.initializePluginLoggers();
    }

    protected addRequirements(reqs: Requirement[]) {
        this.setup().addRequirements(reqs);
    }

    private setup(): BaseSetup {
        if (!this.setupSteps) {
            this.setupSteps = CommandLineUtils.platformFlagIsAndroid(
                this.flags.platform
            )
                ? (this.setupSteps = new AndroidEnvironmentSetup(this.logger))
                : (this.setupSteps = new IOSEnvironmentSetup(this.logger));
        }

        return this.setupSteps;
    }
}