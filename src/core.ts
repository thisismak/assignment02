/* 輸入 Type */
export type BillInput = {
  date: string
  location: string
  tipPercentage: number
  items: BillItem[]
}

type BillItem = SharedBillItem | PersonalBillItem

type CommonBillItem = {
  price: number
  name: string
}

type SharedBillItem = CommonBillItem & {
  isShared: true
}

type PersonalBillItem = CommonBillItem & {
  isShared: false
  person: string
}

/* 輸出 Type */
export type BillOutput = {
  date: string
  location: string
  subTotal: number
  tip: number
  totalAmount: number
  items: PersonItem[]
}

type PersonItem = {
  name: string
  amount: number
}

/* 核心函數 */
export function splitBill(input: BillInput): BillOutput {
  const date = formatDate(input.date)
  const location = input.location
  const subTotal = calculateSubTotal(input.items)
  const tip = calculateTip(subTotal, input.tipPercentage)
  const totalAmount = subTotal + tip

  // 計算每個人的分攤金額
  let items = calculateItems(input.items, input.tipPercentage)

  // 調整金額以確保總金額正確
  adjustAmounts(totalAmount, items)

  return {
    date,
    location,
    subTotal,
    tip,
    totalAmount,
    items,
  }
}

export function formatDate(date: string): string {
  // input format: YYYY-MM-DD, e.g. "2024-03-21"
  // output format: YYYY年M月D日, e.g. "2024年3月21日"

  // 分割日期字串
  const parts = date.split("-")

  // 使用 parseInt 將年份、月份和日期轉換為整數，以去掉前導零。
  let year = parseInt(parts[0])
  let month = parseInt(parts[1])
  let day = parseInt(parts[2])

  // 返回格式化後的字串
  return `${year}年${month}月${day}日`
}

function calculateSubTotal(items: BillItem[]): number {
  // sum up all the price of the items
  return items.reduce((total, item) => total + item.price, 0)
}

export function calculateTip(subTotal: number, tipPercentage: number): number {
  // 計算小費
  const tipAmount = subTotal * (tipPercentage / 100)

  // 四捨五入到最近的 0.1 元
  return Math.round(tipAmount * 10) / 10
}

function scanPersons(items: BillItem[]): string[] {
  const persons = new Set<string>()
  items.forEach((item) => {
    if (!item.isShared && item.person) {
      persons.add(item.person)
    }
  })
  return Array.from(persons)
}

function calculateItems(
  items: BillItem[],
  tipPercentage: number
): PersonItem[] {
  const names = scanPersons(items)
  const persons = names.length

  return names.map((name) => ({
    name,
    amount: calculatePersonAmount({
      items,
      tipPercentage,
      name,
      persons,
    }),
  }))
}

function calculatePersonAmount(input: {
  items: BillItem[]
  tipPercentage: number
  name: string
  persons: number // 將此處的名稱改為 personsCount
}): number {
  let personalAmount = 0
  let sharedAmount = 0

  input.items.forEach((item) => {
    if (item.isShared) {
      sharedAmount += item.price / input.persons // 使用 personsCount
    } else if (item.person === input.name) {
      personalAmount += item.price
    }
  })

  // 計算最終金額，包括分攤的小費
  const totalAmount = personalAmount + sharedAmount
  const individualTip = (totalAmount * input.tipPercentage) / 100

  return parseFloat((totalAmount + individualTip).toFixed(1))
}

function adjustAmounts(totalAmount: number, items: PersonItem[]): void {
  const currentTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const difference = totalAmount - currentTotal

  // 如果沒有誤差，直接返回
  if (Math.abs(difference) < 0.01) return

  // 將差異四捨五入到一位小數
  const roundedDifference = parseFloat(difference.toFixed(1))

  // 按比例調整每個人的金額
  const adjustmentPerPerson = roundedDifference / items.length

  items.forEach((item) => {
    item.amount = parseFloat((item.amount + adjustmentPerPerson).toFixed(1))
  })

  // 最後確保總金額正確
  const finalTotal = items.reduce((sum, item) => sum + item.amount, 0)
  const finalDifference = totalAmount - finalTotal

  // 如果仍然有差異，調整第一個人以消除剩餘的差異
  if (finalDifference !== 0) {
    items[0].amount = parseFloat((items[0].amount + finalDifference).toFixed(1))
  }
}
