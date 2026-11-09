import { Controller, Get } from '@nestjs/common';
import { PipelineService } from './pipeline.service';

@Controller('pipeline')
export class PipelineController {
    constructor(private readonly pipelineService: PipelineService) { }

    @Get('status')
    getStatus() {
        return this.pipelineService.getStatus();
    }
}