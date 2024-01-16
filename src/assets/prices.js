function extractPriceAndCurrency(str) {
    let data = str.trim()
    // Split string into 3 parts: before the first digit, the middle, after the last digit
    const parts = data.split(/(\d+)/)

    // There is no numbers in the string
    if (parts.length < 3) {
        return null
    }

    // Prefer currency symbol before the price
    let currency = parts[0].trim()
    if (currency.length === 0) {
        currency = parts[parts.length - 1].trim()
    }

    // Convert currency to uppercase
    currency = currency.toUpperCase()
    switch (currency) {
        case 'EUR':
            currency = '€'
            break
        case 'USD':
            currency = '$'
            break
        case '-':
            currency = ''
            break
    }

    // Remove currency from price by removing the first and the last elements of parts array
    const priceParts = parts.slice(1, parts.length - 1)

    // Remove from priceParts all elements which contain only whitespace or comma. Ignore new line
    const pricePartsFiltered = priceParts.filter((part) => {
        return part.trim().length > 0 && part.trim() !== ',' || part.includes('\n')
    })

    // If every digital element is followed by another digital element, squash them together
    for (let i = 0; i < pricePartsFiltered.length - 1; i++) {
        if (pricePartsFiltered[i].trim().match(/\d/) && pricePartsFiltered[i + 1].trim().match(/\d/)) {
            pricePartsFiltered[i] += pricePartsFiltered[i + 1]
            pricePartsFiltered.splice(i + 1, 1)
            i--
        }
    }

    // Take the first element of pricePartsFiltered as the price. It must be a digit by now
    let priceStr = pricePartsFiltered[0].trim()
    // If there 3 elements left and the last one is digit, the one in the middle is the decimal separator
    if (pricePartsFiltered.length === 3 && pricePartsFiltered[2].trim().match(/\d/)) {
        priceStr += '.' + pricePartsFiltered[2].trim()
    } else if (pricePartsFiltered.length > 3) {
        // If there are more than 3 elements left, we have a problem
        return null
    }
    return {
        price: parseFloat(priceStr),
        currency: currency
    }
}

export { extractPriceAndCurrency };
