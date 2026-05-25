// apps/api/src/modules/tours/tour-documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service'; // Sử dụng đường dẫn tương đối đồng bộ
import { CreateTourDocumentDto } from './dto/create-tour-document.dto';

@Injectable()
export class TourDocumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Upload and bind a new operational document to a specific tour
   */
  async uploadDocument(tourId: string, organizationId: string, dto: CreateTourDocumentDto) {
    // Kiểm tra tour tồn tại thuộc organization an toàn dữ liệu
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, organizationId },
    });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${tourId} not found under your organization.`);
    }

    return this.prisma.tourDocument.create({
      data: {
        tourId,
        type: dto.type,
        name: dto.name,
        fileUrl: dto.fileUrl,
        mimeType: dto.mimeType || 'application/octet-stream',
        fileSize: dto.fileSize ? Number(dto.fileSize) : null,
      },
    });
  }

  /**
   * Get all active uploaded documents bound to a specific tour
   */
  async getDocuments(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({
      where: { id: tourId, organizationId },
    });
    if (!tour) {
      throw new NotFoundException(`Tour with ID ${tourId} not found under your organization.`);
    }

    return this.prisma.tourDocument.findMany({
      where: { tourId },
      orderBy: { uploadedAt: 'desc' },
    });
  }

  /**
   * Remove a specific document from history
   */
  async deleteDocument(tourId: string, documentId: string, organizationId: string) {
    // Xác thực tài liệu có tồn tại và thuộc Tour được chỉ định hay không
    const document = await this.prisma.tourDocument.findFirst({
      where: {
        id: documentId,
        tourId,
        tour: {
          organizationId,
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found or access denied.`);
    }

    await this.prisma.tourDocument.delete({
      where: { id: documentId },
    });

    return { success: true, message: 'Document unlinked and permanently deleted successfully.' };
  }
}