import { scheduleJob } from 'node-schedule';
import { Logger } from 'pino';
import { Config } from './conf/config';
import { PixarefService } from './service';

export class PixarefScheduler {
    constructor(private service: PixarefService, private logger: Logger, private config: Config) { }

    initialize() {
        const imageCleanupSchedule = this.config.images.cleanup.schedule;
        const imageCleanupThreshold = this.config.images.cleanup.threshold;

        scheduleJob(imageCleanupSchedule, this.performImageCleanup.bind(this, imageCleanupThreshold));
    }

    private async performImageCleanup(threshold: number) {
        const count = await this.service.discardImageZombies(threshold);

        if (count > 0) {
            this.logger.info(`Discarded [${count}] zombie images`);
        }
    }
}