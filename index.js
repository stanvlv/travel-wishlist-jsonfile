const express = require('express')
const {check, validationResult} = require('express-validator')

const fs = require('fs')

const app = express()
const port = 3001
app.use(express.json())


app.get('/', async (req, res) => {
    try {
       const countries = JSON.parse(await fs.promises.readFile('./countries.json'))
       
       // if this is added to the query it will sort them from A to Z
       const sort = req.query.sort
       if(sort === 'true') {
        countries.sort((a, b) => (a.name > b.name) ? 1: -1)
       }
       res.json(countries)
    } catch (error) {
        res.status(500).send("Something went wrong")
    }
})

app.get('/:code', async (req, res) => {
    try {
        const countries = JSON.parse(await fs.promises.readFile('./countries.json'))
        const { code } = req.params
        // it is looking in the array of countries and .find's the one matching the alpha2code to the code from req.params
        const country = countries.find(countryCode => countryCode.alpha2Code === code.toUpperCase() || countryCode.alpha3Code === code.toUpperCase())
        if(!country) {
            res.status(500).send("Country doesn't exist")
            return
        }
        res.json(country)        
    } catch (error) {
        res.status(500).send("Something went wrong")
    }
})

// the check code comes from express-validator and will check for the length
// also will check isAlpha() that only letters are used otherwise returns an error
app.post('/create', [
    check('name').isAlpha(),
    check('alpha2Code').isLength({min: 2, max: 2}).isAlpha(),
    check('alpha3Code').isLength({min: 3, max: 3}).isAlpha()
] , async (req, res) => {
    const errors = validationResult(req)
    if(!errors.isEmpty()) {
        return res.status(422).send("The input you gave is not the one i need")
    }
    try {
        const countries = JSON.parse(await fs.promises.readFile('./countries.json'))
        const { name, alpha2Code, alpha3Code } = req.body
        // this code will put variables to check for duplicates
        const alpha2Dub = countries.some(country => country.alpha2Code === alpha2Code)
        const alpha3Dub = countries.some(country => country.alpha3Code === alpha3Code)
        if(alpha2Dub || alpha3Dub) {
            res.status(500).send("this country exists")
            // don't forget the return otherwise it will give you the status
            // but it will still add the country without return
            // now i have 1 country two times because the code continued
            return
        }
        // search the max id number in the array
        const id = countries.reduce((max, country) => Math.max(max, country.id), 0)
        // when creating the country just take the max id + 1
        const createCountry = { id: id + 1, name, alpha2Code, alpha3Code};
        countries.push(createCountry)
        await fs.promises.writeFile('./countries.json', JSON.stringify(countries))
        res.json(createCountry)
    } catch (error) {
        res.status(500).send("Something went wrong")
    }
})

app.put('/:code', async (req, res) => {
    try {
        const { code } = req.params
        const { name, alpha2Code, alpha3Code } = req.body
        const countries = JSON.parse(await fs.promises.readFile('./countries.json'))
        const country = countries.find(countryCode => countryCode.alpha2Code === code.toUpperCase() || countryCode.alpha3Code === code.toUpperCase())
        if(!country) {
            res.status(500).send("Country doesn't exist")
        }
        // after finding the single country from matching code it replaces with the given req.body
        country.name = name
        country.alpha2Code = alpha2Code
        country.alpha3Code = alpha3Code
        // this will make a promise and writeFile the new values
        await fs.promises.writeFile('./countries.json', JSON.stringify(countries))
        res.json(country)       
    } catch (error) {
        res.status(500).send("Something went wrong")
    }
})

app.delete('/:code', async (req, res) => {
    try {
        const { code } = req.params
        const countries = JSON.parse(await fs.promises.readFile('./countries.json'))
        // this will filter out the country which is different from the code in req.params
        // in this case it will be one country code and this will be removed
        const deleteCountry = countries.filter(country => !(country.alpha2Code === code.toUpperCase() || country.alpha3Code === code.toUpperCase()))
        // this will make a promise with writeFile with already filtered out country and save the file
        await fs.promises.writeFile('./countries.json', JSON.stringify(deleteCountry))
        res.json(deleteCountry)
    } catch (error) {
        res.status(500).send("Something went wrong")
    }
})


app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})