const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : 'postgres',
    password : 'Postgres7915!',
    database : 'smart-brain'
  }
});


db.select('*').from('users').then(data => {
 	console.log(data);
 });

const app = express();


const database = {
	users: [
		{
			id: '123',
			name: 'John',
			email: 'john@gmail.com',
			password: 'cookies',
			entries: 0,
			joined: new Date()
		},
		{
			id: '124',
			name: 'Sally',
			email: 'Sally@gmail.com',
			password: 'bananas',
			entries: 0,
			joined: new Date()
		},
	]
}


app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res)=> {
	res.send(database.users);
})

app.post('/signin', (req, res) => {
  db.select('email', 'hash').fom('login')
  	.where('email', '=', req.body.email)
  	.then(data => {
  		const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
  		if (isValid) {
  			return db.select('*').from('users')
  				.where('email', '=', req.body.email)
  				.then(user => {
  					res.json(user[0])
  				})
  				.catch(err => res.status(400).json('unable to get user'))
  		} else {
  			res.status(400).json('wrong credentials')
  		}
  	})
  	.catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req, res) => {
	const {email, name, password} = req.body;
	const hash = bcrypt.hashSync(password, 11);
		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
				return trx('users')
					.returning('*')
					.insert({
						email: loginEmail[0],
						name: name,
						joined: new Date()
					})
					.then(user => {
						res.json(user[0]);
					})
				})
				.then(trx.commit)  //Finishing up the SQL transaction.
				.catch(trx.rollback)  //Escaping the entire SQL transaction if there is an issue to prevent mixed up results/db.
		})
		.catch(err => res.status(400).json('unable to register'))		
})

app.get('/profile/:id', (req, res) => {
	const { id } = req.params;
	db.select('*').from ('users').where({id})
		.then(user => {
			if(user.length) {
				res.json(user[0])
			} else {
				res.status(400).json('Not found')
			}
		})
		.catch(err => res.status(400).json('error getting user'))

	//let found = false;
	// database.users.forEach(user => {
	// 	if (user.id === id) {
	// 		found = true;
	// 		return res.json(user);
	// 	}
	// })
	// if (!found) {
	// 	res.status(400).json('not found profile');
	// }
})

app.put('/image', (req, res) => {
	const { id } = req.body;
	db('users').where('id', '=', id)
		.increment('entries', 1)
		.returning('entries')
		.then(entries => {
			res.json(entries[0]);
		})
		.catch(err => res.status(400).json('unable to get entries'))
})


app.listen(3000, ()=> {
	console.log('Server is listening on port 3000.');
})