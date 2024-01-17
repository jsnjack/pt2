import { test, expect } from 'vitest'
import { extractPriceAndCurrency } from '../src/assets/prices.js'

test('extracts price and currency correctly', () => {
    const result = extractPriceAndCurrency('123.45 EUR')
    expect(result).toEqual({ price: 123.45, currency: '€' })
})

test('handles no currency', () => {
    const result = extractPriceAndCurrency('123.45')
    expect(result).toEqual({ price: 123.45, currency: '€' })
})

test('returns null when no match is found', () => {
    const result = extractPriceAndCurrency('no price here')
    expect(result).toBeNull()
})

test('handles price without decimal places', () => {
    const result = extractPriceAndCurrency('123 EUR')
    expect(result).toEqual({ price: 123, currency: '€' })
})

test('handles price with currency lowercase', () => {
    const result = extractPriceAndCurrency('123eur')
    expect(result).toEqual({ price: 123, currency: '€' })
})

test('handles price without space before currency', () => {
    const result = extractPriceAndCurrency('123.45EUR')
    expect(result).toEqual({ price: 123.45, currency: '€' })
})

test('handles price with EUR first', () => {
    const result = extractPriceAndCurrency('EUR123.45')
    expect(result).toEqual({ price: 123.45, currency: '€' })
})

test('handles price with EUR first with space', () => {
    const result = extractPriceAndCurrency('EUR 123.45')
    expect(result).toEqual({ price: 123.45, currency: '€' })
})

test('handles price with $ first with space', () => {
    const result = extractPriceAndCurrency('$ 123.45')
    expect(result).toEqual({ price: 123.45, currency: '$' })
})

test('handles price with $ first without space', () => {
    const result = extractPriceAndCurrency('$123.45')
    expect(result).toEqual({ price: 123.45, currency: '$' })
})

test('handles price with $ last without space', () => {
    const result = extractPriceAndCurrency('123.45$')
    expect(result).toEqual({ price: 123.45, currency: '$' })
})

test('handles comma as separator', () => {
    const result = extractPriceAndCurrency('1,230.45$')
    expect(result).toEqual({ price: 1230.45, currency: '$' })
})

test('handles price with new line as delimeter', () => {
    const result = extractPriceAndCurrency('12 \n 30')
    expect(result).toEqual({ price: 12.30, currency: '€' })
})

test('handles price with currency without symbol', () => {
    const result = extractPriceAndCurrency('123BYN')
    expect(result).toEqual({ price: 123, currency: 'BR' })
})

test('handles price with currency without symbol in lower case', () => {
    const result = extractPriceAndCurrency('123byn')
    expect(result).toEqual({ price: 123, currency: 'BR' })
})

test('handles price with currency without symbol in mixed case', () => {
    const result = extractPriceAndCurrency('123bYn')
    expect(result).toEqual({ price: 123, currency: 'BR' })
})

test('handles price on bol.com', () => {
    const result = extractPriceAndCurrency('20\n  -\n')
    expect(result).toEqual({ price: 20, currency: '€' })
})

test('handles price on zalando', () => {
    const result = extractPriceAndCurrency('€ 279,50')
    expect(result).toEqual({ price: 279.5, currency: '€' })
})

test('handles price on ea', () => {
    const result = extractPriceAndCurrency('€69.99')
    expect(result).toEqual({ price: 69.99, currency: '€' })
})

test('handles price on fonq', () => {
    const result = extractPriceAndCurrency('€\n69\n99')
    expect(result).toEqual({ price: 69.99, currency: '€' })
})

test('handles price on zalando with text', () => {
    const result = extractPriceAndCurrency('Vanaf € 221,95')
    expect(result).toEqual({ price: 221.95, currency: '€' })
})
