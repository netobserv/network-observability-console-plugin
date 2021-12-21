import { Column, ColumnsId } from '../netflow-table-header';

export const ColumnsSample: Column[] = [
  { id: ColumnsId.date, name: 'Date & time', isSelected: true, defaultOrder: 1 },
  { id: ColumnsId.srcpod, name: 'Src pod', isSelected: true, defaultOrder: 2 },
  { id: ColumnsId.dstpod, name: 'Dst pod', isSelected: true, defaultOrder: 3 },
  { id: ColumnsId.srcnamespace, name: 'Src namespace', isSelected: true, defaultOrder: 4 },
  { id: ColumnsId.dstnamespace, name: 'Dst namespace', isSelected: true, defaultOrder: 5 },
  { id: ColumnsId.srcport, name: 'Src port', isSelected: true, defaultOrder: 6 },
  { id: ColumnsId.dstport, name: 'Dst port', isSelected: true, defaultOrder: 7 },
  { id: ColumnsId.protocol, name: 'Protocol', isSelected: true, defaultOrder: 8 },
  { id: ColumnsId.bytes, name: 'Bytes', isSelected: true, defaultOrder: 9 },
  { id: ColumnsId.packets, name: 'Packets', isSelected: true, defaultOrder: 10 }
];
