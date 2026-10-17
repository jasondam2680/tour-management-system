// apps/api/src/modules/service-arrangements/service-arrangements.service.ts
import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ArrangementStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { CreateArrangementDto } from './dto/create-arrangement.dto';
import { UpdateArrangementDto } from './dto/update-arrangement.dto';
import { QueryArrangementDto } from './dto/query-arrangement.dto';
import { CreateGuestDto } from './dto/create-guest.dto';
import { UpdateGuestDto } from './dto/update-guest.dto';
import { CreateArrangementPaymentDto } from './dto/create-payment.dto';

const clean = (v: any): string | undefined => {
  if (v === undefined || v === null) return undefined;
  const s = String(v).trim();
  return s === '' ? undefined : s;
};

const normHeader = (h: any): string =>
  String(h ?? '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9一-鿿]/g, '');

const HEADER_MAP: Record<string, string> = {
  hoten: 'fullName', name: 'fullName', fullname: 'fullName', ten: 'fullName', 姓名: 'fullName',
  sohochieu: 'passportNo', sohc: 'passportNo', passport: 'passportNo',
  passportno: 'passportNo', passportnumber: 'passportNo', hochieu: 'passportNo', 护照: 'passportNo',
  gioitinh: 'gender', gender: 'gender', sex: 'gender', phai: 'gender', 性别: 'gender',
  quoctich: 'nationality', nationality: 'nationality', citizenship: 'nationality', 国籍: 'nationality',
  ngaysinh: 'birthDate', dob: 'birthDate', birthdate: 'birthDate', dateofbirth: 'birthDate', 出生日期: 'birthDate',
  noisinh: 'birthPlace', birthplace: 'birthPlace', placeofbirth: 'birthPlace', 出生地: 'birthPlace',
  ngaycap: 'issueDate', issuedate: 'issueDate', dateofissue: 'issueDate', 签发日期: 'issueDate',
  noicap: 'issuePlace', issueplace: 'issuePlace', placeofissue: 'issuePlace', 签发地: 'issuePlace',
  hieuluc: 'expiryDate', expiry: 'expiryDate', expirydate: 'expiryDate',
  validuntil: 'expiryDate', ngayhethan: 'expiryDate', 有效期: 'expiryDate',
  coquancap: 'issueAuthority', authority: 'issueAuthority',
  issuingauthority: 'issueAuthority', 签发机关: 'issueAuthority',
  sdt: 'phone', phone: 'phone', dienthoai: 'phone', sodienthoai: 'phone', 电话: 'phone',
  loaiphong: 'roomType', roomtype: 'roomType', room: 'roomType', 房型: 'roomType',
};

function parseExcelDate(v: any): Date | undefined {
  if (v === undefined || v === null || v === '') return undefined;
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  if (typeof v === 'number' && isFinite(v)) {
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? undefined : d;
  }
  const s = String(v).trim();
  const m = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (m) {
    const d = Number(m[1]); const mo = Number(m[2]) - 1; let y = Number(m[3]);
    if (y < 100) y += 2000;
    const dt = new Date(y, mo, d);
    return isNaN(dt.getTime()) ? undefined : dt;
  }
  const dt = new Date(s);
  return isNaN(dt.getTime()) ? undefined : dt;
}

@Injectable()
export class ServiceArrangementsService {
  constructor(private readonly prisma: PrismaService) {}

  private calcTotal(quantity: any, unitPrice: any): number {
    const q = quantity === undefined || quantity === null ? 1 : Number(quantity);
    return Number(unitPrice) * (isFinite(q) ? q : 1);
  }

  private async ensureTour(tourId: string, organizationId: string) {
    const tour = await this.prisma.tour.findFirst({ where: { id: tourId, organizationId } });
    if (!tour) throw new NotFoundException(`Tour ${tourId} not found`);
    return tour;
  }

  private async ensureArrangement(id: string, organizationId: string) {
    const arr = await this.prisma.tourServiceArrangement.findFirst({
      where: { id, organizationId },
      include: { supplier: { select: { id: true, name: true } } },
    });
    if (!arr) throw new NotFoundException(`Arrangement ${id} not found`);
    return arr;
  }

  // ============================ ARRANGEMENTS ============================

  async listArrangements(tourId: string, organizationId: string, query: QueryArrangementDto) {
    await this.ensureTour(tourId, organizationId);
    return this.prisma.tourServiceArrangement.findMany({
      where: {
        tourId, organizationId,
        ...(query.serviceType ? { serviceType: query.serviceType } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        supplier: { select: { id: true, name: true } },
        resource: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { serviceDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createArrangement(tourId: string, dto: CreateArrangementDto, organizationId: string) {
    await this.ensureTour(tourId, organizationId);
    const totalAmount = this.calcTotal(dto.quantity, dto.unitPrice);
    return this.prisma.tourServiceArrangement.create({
      data: {
        organizationId,
        tourId,
        serviceType: dto.serviceType,
        supplierId: clean(dto.supplierId),
        resourceId: clean(dto.resourceId),
        serviceDate: dto.serviceDate ? new Date(dto.serviceDate) : undefined,
        description: clean(dto.description),
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        unitPrice: dto.unitPrice,
        currency: dto.currency as any,
        totalAmount,
        payBy: dto.payBy as any,
        notes: clean(dto.notes),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  getArrangement(id: string, organizationId: string) {
    return this.ensureArrangement(id, organizationId);
  }

  async updateArrangement(id: string, dto: UpdateArrangementDto, organizationId: string) {
    const arr = await this.ensureArrangement(id, organizationId);
    const quantity = dto.quantity !== undefined ? dto.quantity : arr.quantity;
    const unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : arr.unitPrice;
    const totalAmount =
      dto.quantity !== undefined || dto.unitPrice !== undefined
        ? this.calcTotal(quantity, unitPrice)
        : undefined;
    return this.prisma.tourServiceArrangement.update({
      where: { id },
      data: {
        ...(dto.serviceType ? { serviceType: dto.serviceType } : {}),
        supplierId: dto.supplierId !== undefined ? clean(dto.supplierId) : undefined,
        resourceId: dto.resourceId !== undefined ? clean(dto.resourceId) : undefined,
        serviceDate: dto.serviceDate !== undefined
          ? (dto.serviceDate ? new Date(dto.serviceDate) : null) : undefined,
        description: dto.description !== undefined ? clean(dto.description) : undefined,
        quantity: dto.quantity !== undefined ? dto.quantity : undefined,
        unitPrice: dto.unitPrice !== undefined ? dto.unitPrice : undefined,
        ...(totalAmount !== undefined ? { totalAmount } : {}),
        currency: dto.currency as any,
        payBy: dto.payBy as any,
        notes: dto.notes !== undefined ? clean(dto.notes) : undefined,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deleteArrangement(id: string, organizationId: string) {
    await this.ensureArrangement(id, organizationId);
    await this.prisma.tourServiceArrangement.delete({ where: { id } });
    return { deleted: true };
  }

  async transition(id: string, organizationId: string, target: ArrangementStatus) {
    const arr = await this.ensureArrangement(id, organizationId);
    const from = arr.status as ArrangementStatus;
    const allowed: Record<ArrangementStatus, ArrangementStatus[]> = {
      PENDING: ['CONFIRMED', 'PAID', 'CANCELLED'],
      CONFIRMED: ['PAID', 'CANCELLED'],
      PAID: [],
      CANCELLED: ['PENDING'],
    };
    if (!allowed[from].includes(target)) {
      throw new BadRequestException(`Không thể chuyển từ ${from} sang ${target}`);
    }
    return this.prisma.tourServiceArrangement.update({
      where: { id }, data: { status: target },
    });
  }

  async createPayment(id: string, dto: CreateArrangementPaymentDto, organizationId: string) {
    const arr = await this.ensureArrangement(id, organizationId);
    const tour = await this.ensureTour(arr.tourId, organizationId);
    if (arr.status === 'CANCELLED') {
      throw new BadRequestException('Dòng dịch vụ đã huỷ, không tạo thanh toán');
    }
    const payment = await this.prisma.supplierPayment.create({
      data: {
        bookingId: clean(dto.bookingId),
        tourId: arr.tourId,
        supplierId: arr.supplierId || undefined,
        amount: arr.totalAmount,
        currency: arr.currency,
        method: dto.method || 'bank_transfer',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        notes: `[Sắp xếp DV] ${arr.serviceType}${arr.description ? ' - ' + arr.description : ''} | Tour ${tour.code}${dto.notes ? ' | ' + dto.notes : ''}`,
      },
    });
    return payment;
  }

  // ============================ GUESTS ============================

  async listGuests(tourId: string, organizationId: string) {
    await this.ensureTour(tourId, organizationId);
    return this.prisma.tourGuest.findMany({
      where: { tourId, organizationId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async createGuest(tourId: string, dto: CreateGuestDto, organizationId: string) {
    await this.ensureTour(tourId, organizationId);
    if (!clean(dto.fullName)) throw new BadRequestException('Họ tên là bắt buộc');
    return this.prisma.tourGuest.create({
      data: {
        organizationId, tourId,
        fullName: dto.fullName.trim(),
        gender: clean(dto.gender),
        nationality: clean(dto.nationality),
        passportNo: clean(dto.passportNo),
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        birthPlace: clean(dto.birthPlace),
        issueDate: dto.issueDate ? new Date(dto.issueDate) : undefined,
        issuePlace: clean(dto.issuePlace),
        expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
        issueAuthority: clean(dto.issueAuthority),
        roomType: clean(dto.roomType),
        phone: clean(dto.phone),
        notes: clean(dto.notes),
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  private async ensureGuest(id: string, organizationId: string) {
    const g = await this.prisma.tourGuest.findFirst({ where: { id, organizationId } });
    if (!g) throw new NotFoundException(`Guest ${id} not found`);
    return g;
  }

  getGuest(id: string, organizationId: string) {
    return this.ensureGuest(id, organizationId);
  }

  async updateGuest(id: string, dto: UpdateGuestDto, organizationId: string) {
    await this.ensureGuest(id, organizationId);
    return this.prisma.tourGuest.update({
      where: { id },
      data: {
        fullName: dto.fullName !== undefined ? (clean(dto.fullName) as string) : undefined,
        gender: dto.gender !== undefined ? clean(dto.gender) : undefined,
        nationality: dto.nationality !== undefined ? clean(dto.nationality) : undefined,
        passportNo: dto.passportNo !== undefined ? clean(dto.passportNo) : undefined,
        birthDate: dto.birthDate !== undefined
          ? (dto.birthDate ? new Date(dto.birthDate) : null) : undefined,
        birthPlace: dto.birthPlace !== undefined ? clean(dto.birthPlace) : undefined,
        issueDate: dto.issueDate !== undefined
          ? (dto.issueDate ? new Date(dto.issueDate) : null) : undefined,
        issuePlace: dto.issuePlace !== undefined ? clean(dto.issuePlace) : undefined,
        expiryDate: dto.expiryDate !== undefined
          ? (dto.expiryDate ? new Date(dto.expiryDate) : null) : undefined,
        issueAuthority: dto.issueAuthority !== undefined ? clean(dto.issueAuthority) : undefined,
        roomType: dto.roomType !== undefined ? clean(dto.roomType) : undefined,
        phone: dto.phone !== undefined ? clean(dto.phone) : undefined,
        notes: dto.notes !== undefined ? clean(dto.notes) : undefined,
        sortOrder: dto.sortOrder,
      },
    });
  }

  async deleteGuest(id: string, organizationId: string) {
    await this.ensureGuest(id, organizationId);
    await this.prisma.tourGuest.delete({ where: { id } });
    return { deleted: true };
  }

  async importGuests(tourId: string, buffer: Buffer, organizationId: string) {
    await this.ensureTour(tourId, organizationId);
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    if (!sheet) throw new BadRequestException('File Excel không có sheet nào');
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    if (rows.length < 2) throw new BadRequestException('File không có dữ liệu');

    const headerIdx: Record<string, number> = {};
    rows[0].forEach((h: any, i: number) => {
      const f = HEADER_MAP[normHeader(h)];
      if (f && headerIdx[f] === undefined) headerIdx[f] = i;
    });
    if (headerIdx['fullName'] === undefined) {
      throw new BadRequestException('Không tìm thấy cột họ tên trong file (cần cột: Họ tên / Name / 姓名)');
    }

    let created = 0; let updated = 0; let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let r = 1; r < rows.length; r++) {
      const row = rows[r];
      const get = (f: string) => {
        const i = headerIdx[f];
        return i === undefined ? undefined : clean(row[i]);
      };
      const fullName = get('fullName');
      const passportNo = get('passportNo');
      if (!fullName && !passportNo) { skipped++; continue; }
      if (!fullName) { skipped++; errors.push({ row: r + 1, reason: 'Thiếu họ tên' }); continue; }

      const data: any = {
        organizationId, tourId,
        fullName,
        gender: get('gender'),
        nationality: get('nationality'),
        passportNo,
        birthDate: parseExcelDate(headerIdx['birthDate'] !== undefined ? row[headerIdx['birthDate']] : undefined),
        birthPlace: get('birthPlace'),
        issueDate: parseExcelDate(headerIdx['issueDate'] !== undefined ? row[headerIdx['issueDate']] : undefined),
        issuePlace: get('issuePlace'),
        expiryDate: parseExcelDate(headerIdx['expiryDate'] !== undefined ? row[headerIdx['expiryDate']] : undefined),
        issueAuthority: get('issueAuthority'),
        roomType: get('roomType'),
        phone: get('phone'),
        sortOrder: r,
      };
      try {
        if (passportNo) {
          const existing = await this.prisma.tourGuest.findFirst({
            where: { tourId, organizationId, passportNo },
          });
          if (existing) {
            await this.prisma.tourGuest.update({ where: { id: existing.id }, data });
            updated++;
            continue;
          }
        }
        await this.prisma.tourGuest.create({ data });
        created++;
      } catch (e: any) {
        skipped++;
        errors.push({ row: r + 1, reason: e?.message || 'Lỗi không xác định' });
      }
    }

    return { total: rows.length - 1, created, updated, skipped, errors };
  }
}
