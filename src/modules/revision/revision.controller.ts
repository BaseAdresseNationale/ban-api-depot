import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Put,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

import { CustomRequest } from '@/lib/types/request.type';
import { ParseDatePipe } from '@/lib/class/pipes/date.pipe';
import { FileService } from '@/modules/file/file.service';
import { Revision, StatusRevisionEnum } from './revision.schema';
import { RevisionService } from './revision.service';
import { RevisionWithClientDTO } from './dto/revision_with_client.dto';
import { AdminGuard } from '@/lib/class/guards/admin.guard';

@ApiTags('revisions')
@Controller('')
export class RevisionController {
  constructor(
    private revisionService: RevisionService,
    private fileService: FileService,
  ) {}

  @Get('current-revisions')
  @ApiOperation({
    summary: 'Find current revision by Commune',
    operationId: 'findCurrent',
  })
  @ApiQuery({ name: 'publishedSince', required: false, type: Date })
  @ApiResponse({ status: HttpStatus.OK, type: RevisionWithClientDTO })
  async findCurrents(
    @Query('publishedSince', ParseDatePipe)
    publishedSince: Date,
    @Res() res: Response,
  ) {
    const revisions: Revision[] =
      await this.revisionService.findCurrents(publishedSince);
    const revisionsWithClients: RevisionWithClientDTO[] =
      await this.revisionService.expandsWithClients(revisions);
    res.status(HttpStatus.OK).json(revisionsWithClients);
  }

  @Get('communes/:codeCommune/current-revision')
  @ApiOperation({
    summary: 'Find current revision by Commune',
    operationId: 'findCommuneCurrent',
  })
  @ApiParam({ name: 'codeCommune', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, type: RevisionWithClientDTO })
  async findCurrent(@Req() req: CustomRequest, @Res() res: Response) {
    const revision: Revision = await this.revisionService.findCurrent(
      req.params.codeCommune,
    );

    const currentRevision: RevisionWithClientDTO =
      await this.revisionService.expandWithClientAndFile(revision);
    res.status(HttpStatus.OK).json(currentRevision);
  }

  @Get('communes/:codeCommune/revisions')
  @ApiOperation({
    summary: 'Find revisions by Commune',
    operationId: 'findByCommune',
  })
  @ApiParam({ name: 'codeCommune', required: true, type: String })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RevisionWithClientDTO,
    isArray: true,
  })
  async findByCommune(@Req() req: CustomRequest, @Res() res: Response) {
    const revisions: Revision[] = await this.revisionService.findMany({
      codeCommune: req.params.codeCommune,
    });
    const revisionsWithClients: RevisionWithClientDTO[] =
      await this.revisionService.expandsWithClients(revisions);
    res.status(HttpStatus.OK).json(revisionsWithClients);
  }

  @Get('communes/:codeCommune/current-revision/files/bal/download')
  @ApiOperation({
    summary: 'Download file current revision by Commune',
    operationId: 'DownloadFileCurrent',
  })
  @ApiParam({ name: 'codeCommune', required: true, type: String })
  async downloadFileCurrent(@Req() req: CustomRequest, @Res() res: Response) {
    const revision: Revision = await this.revisionService.findCurrent(
      req.params.codeCommune,
    );
    const data: Buffer = await this.fileService.findDataByRevision(
      revision._id,
    );

    res.attachment(`bal-${revision.codeCommune}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(data);
  }

  @Get('revisions/:revisionId')
  @ApiOperation({
    summary: 'Find one revision',
    operationId: 'findOne',
  })
  @ApiParam({ name: 'revisionId', required: true, type: String })
  @ApiResponse({ status: HttpStatus.OK, type: RevisionWithClientDTO })
  async findOne(@Req() req: CustomRequest, @Res() res: Response) {
    const revisionWithClient: RevisionWithClientDTO =
      await this.revisionService.expandWithClientAndFile(req.revision);
    res.status(HttpStatus.OK).json(revisionWithClient);
  }

  @Get('revisions/:revisionId/files/bal/download')
  @ApiParam({ name: 'revisionId', required: true, type: String })
  @ApiOperation({
    summary: 'Download file current revision by Commune',
    operationId: 'DownloadFileCurrent',
  })
  async downloadFile(@Req() req: CustomRequest, @Res() res: Response) {
    if (req.revision.status !== StatusRevisionEnum.PUBLISHED) {
      throw new HttpException(
        'La révision n’est pas encore accessible car non publiée',
        HttpStatus.FORBIDDEN,
      );
    }
    const data: Buffer = await this.fileService.findDataByRevision(
      req.revision._id,
    );

    res.attachment(`bal-${req.revision.codeCommune}.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.send(data);
  }

  @Put('revisions/:revisionId/current')
  @ApiOperation({
    summary: 'Changer la révision courante',
    description: 'Changer la révision courante',
    operationId: 'changeCurrentOne',
  })
  @ApiParam({
    name: 'revisionId',
    required: true,
    type: String,
    description: 'L’id de la revision ’published’',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: RevisionWithClientDTO,
  })
  @ApiBearerAuth('admin-token')
  @UseGuards(AdminGuard)
  async changeCurrentOne(@Req() req: CustomRequest, @Res() res: Response) {
    const revision: Revision = await this.revisionService.changeCurrentOne(
      req.revision,
    );

    const revisionWithClient: RevisionWithClientDTO =
      await this.revisionService.expandWithClientAndFile(revision);
    res.status(HttpStatus.OK).json(revisionWithClient);
  }
}
