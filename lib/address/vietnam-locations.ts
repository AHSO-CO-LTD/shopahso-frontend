import provincesJson from "@/data/province.json";
import wardsJson from "@/data/ward.json";

type ProvinceRecord = {
  code: string;
  name: string;
  name_with_type: string;
};

type WardRecord = {
  code: string;
  name: string;
  name_with_type: string;
  parent_code: string;
};

export type ProvinceOption = {
  code: string;
  name: string;
};

export type WardOption = {
  code: string;
  name: string;
  provinceCode: string;
};

const provinceRecords = provincesJson as Record<string, ProvinceRecord>;
const wardRecords = wardsJson as Record<string, WardRecord>;

export const provinceOptions: ProvinceOption[] = Object.values(provinceRecords)
  .map((province) => ({
    code: province.code,
    name: province.name_with_type || province.name,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "vi"));

export const wardOptions: WardOption[] = Object.values(wardRecords)
  .map((ward) => ({
    code: ward.code,
    name: ward.name_with_type || ward.name,
    provinceCode: ward.parent_code,
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "vi"));

export function getWardsByProvinceCode(provinceCode: string) {
  if (!provinceCode) {
    return [];
  }

  return wardOptions.filter((ward) => ward.provinceCode === provinceCode);
}
