// User title options
export const USER_TITLE_OPTIONS = [
  "Mr",
  "Mrs", 
  "Ms",
  "Miss",
  "Dr",
  "Prof",
  "Rev",
  "Min",
  "Pastor",
  "Apostle",
  "Bishop",
  "Evangelist",
  "Deacon",
  "Elder",
] as const;

export type UserTitle = typeof USER_TITLE_OPTIONS[number];