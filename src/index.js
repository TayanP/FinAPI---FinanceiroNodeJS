const express = require('express')
const {v4: uuid } = require('uuid')

const app = express()
app.use(express.json())

const customers = []

/* criando uma conta 
 cpf = string, name = string, id = uuid, statement = []
 next vai definir se o middleware vai proseguir ou se vai parar onde está  */
 //Middleware
 function verificaExistCPF(request, response, next) {
  const { cpf} = request.headers
  const customer = customers.find((customer) => customer.cpf === cpf)
 
 if(!customer) {
  return response.status(400).json({error: "Cliente não encontrado"})
 } 

 request.customer = customer
//se existir
 return next()

 }

 function getBalance(statement) {
  //pega as informaçoes de determinado valor e transforma em um valor somente
  const balance = statement.reduce((acc, operation) => {
    if(operation.type === 'credit') {
      return acc + operation.amount
    } else {
     return acc - operation.amount
    }
  }, 0)
  return balance
 } 

app.post('/account',( request, response) => {
 const {cpf, nome} = request.body

 /* some vai uma buscar e retornar falso ou true, se dentro do customer se ja existe  o cpf que to cadastrando */
 const cpfExistente = customers.some((customer) => customer.cpf === cpf)
 /* se já existir  */
 if (cpfExistente) {
   return response.status(400).json({error: "Cliente já existe"})
 }
//depois que pegar todos os dados, adiciona mais um
 customers.push({
  id: uuid(),
  cpf,
  nome,
  statement: []
 })
 return response.status(201).send()

})
//
app.get('/statement', verificaExistCPF, (request, response) => {
 const { customer} = request
 return response.json(customer.statement)
})

app.post('/deposit', verificaExistCPF, (request, response) => {
 const { description, amount} = request.body
 const { customer} = request

 const statementOperation = {
  description,
  amount,
  created_at: new Date(),
  type:  "credit"
 }
 //está passando statementOperation para dentro do customer
 customer.statement.push(statementOperation)
 return response.status(201).send()

})

app.post('/saque', verificaExistCPF, (request, response) => {
 const { amount } = request.body
 const {customer} = request

 const balance = getBalance(customer.statement)

 if(balance < amount) {
  return response.status(400).json({error: "Não há dinheiro usuficiente"})
 }
 const statementOperation = {
  amount,
  created_at: new Date(),
  type:  "debit"
 }
 customer.statement.push(statementOperation)
 return response.status(201).send()
})

app.get('/statement/date', verificaExistCPF, (request, response) => {
 const { customer} = request
 const { date } = request.query

 const dateFormat = new Date(date +  " 00:00")

 const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())
 //se ele encontrar 
 return response.json(statement)
})
 
app.put('/account', verificaExistCPF, (request,response) => {
 const { name} = request.body
 const { customer } = request

 customer.name = name
 return response.status(201).send()
})
app.get('/account', verificaExistCPF, (request, response) => {
 const { customer } = request
 return response.json(customer)
})
app.delete('/account', verificaExistCPF, (request,response) => {
 const { customer } = request

 //splice
 customers.splice(customer, 1)
 return response.status(200).json(customers)
})
app.get('/balance', verificaExistCPF, (request,response) => {
 const { customer} = request

 const balance = getBalance(customer.statement)
 return response.json(balance)
})

app.listen(3333)
