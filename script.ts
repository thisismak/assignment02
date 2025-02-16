export type BillInput = {
    date: string;
    location: string;
    tipPercentage: number;
    items: BillItem[];
  };
  
  type BillItem = SharedBillItem | PersonalBillItem;
  
  type CommonBillItem = {
    price: number;
    name: string;
  };
  
  type SharedBillItem = CommonBillItem & {
    isShared: true;
  };
  
  type PersonalBillItem = CommonBillItem & {
    isShared: false;
    person: string;
  };
  
  export type BillOutput = {
    date: string;
    location: string;
    subTotal: number;
    tip: number;
    totalAmount: number;
    items: PersonItem[];
  };
  
  type PersonItem = {
    name: string;
    amount: number;
  };
  
  export function splitBill(input: BillInput): BillOutput {
    let date = formatDate(input.date);
    let location = input.location;
    let subTotal = calculateSubTotal(input.items);
    let tip = calculateTip(subTotal, input.tipPercentage);
    let totalAmount = subTotal + tip;
    let items = calculateItems(input.items, input.tipPercentage);
  
    adjustAmount(totalAmount, items);
  
    return {
      date,
      location,
      subTotal,
      tip,
      totalAmount,
      items,
    };
  }
  
  export function formatDate(date: string): string {
    const [year, month, day] = date.split('-');
    return `${year}年${parseInt(month)}月${parseInt(day)}日`;
  }
  
  function calculateSubTotal(items: BillItem[]): number {
    return items.reduce((total, item) => total + item.price, 0);
  }
  
  export function calculateTip(subTotal: number, tipPercentage: number): number {
    return parseFloat((subTotal * (tipPercentage / 100)).toFixed(1));
  }
  
  function scanPersons(items: BillItem[]): string[] {
    const personsSet = new Set<string>();
    items.forEach(item => {
      if (!item.isShared) {
        personsSet.add(item.person);
      }
    });
    return Array.from(personsSet);
  }
  
  function calculateItems(items: BillItem[], tipPercentage: number): PersonItem[] {
    let names = scanPersons(items);
    let persons = names.length;
    return names.map(name => ({
      name,
      amount: calculatePersonAmount({
        items,
        tipPercentage,
        name,
        persons,
      }),
    }));
  }
  
  function calculatePersonAmount(input: {
    items: BillItem[];
    tipPercentage: number;
    name: string;
    persons: number;
  }): number {
    let amount = 0;
    input.items.forEach(item => {
      if (item.isShared) {
        amount += item.price / input.persons;
      } else if (item.person === input.name) {
        amount += item.price;
      }
    });
  
    const tip = (amount * input.tipPercentage) / 100;
    amount += tip;
  
    return parseFloat(amount.toFixed(1));
  }
  
  function adjustAmount(totalAmount: number, items: PersonItem[]): void {
    const totalCalculated = items.reduce((sum, item) => sum + item.amount, 0);
    const difference = totalAmount - totalCalculated;
  
    if (difference !== 0) {
      let adjustment = parseFloat((difference / items.length).toFixed(1));
      items.forEach(item => {
        item.amount = parseFloat((Math.round((item.amount + adjustment) * 10) / 10).toFixed(1));
      });
  
      const newTotal = items.reduce((sum, item) => sum + item.amount, 0);
      const finalDifference = totalAmount - newTotal;
  
      if (finalDifference !== 0) {
        items[0].amount = parseFloat((items[0].amount + finalDifference).toFixed(1));
      }
    }
  }