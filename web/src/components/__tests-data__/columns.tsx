import { Column, ColumnsId } from '../netflow-table-header';

export const ColumnsSample: Column[] = [
    { id: ColumnsId.date, name: "Date & time" },
    { id: ColumnsId.srcpod, name: "Src pod" },
    { id: ColumnsId.dstpod, name: "Dst pod" },
    { id: ColumnsId.srcnamespace, name: "Src namespace" },
    { id: ColumnsId.dstnamespace, name: "Dst namespace" },
    { id: ColumnsId.srcport, name: "Src port" },
    { id: ColumnsId.dstport, name: "Dst port" },
    { id: ColumnsId.protocol, name: "Protocol" },
    { id: ColumnsId.bytes, name: "Bytes" },
    { id: ColumnsId.packets, name: "Packets" },
];
