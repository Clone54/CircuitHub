import jwt from 'jsonwebtoken';

const token = jwt.sign({ user_id: 'user123', email: 'test@example.com' }, 'dummy');

fetch('http://localhost:3000/api/thesis-chapters/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ title: 'Test Chapter', bullets: '1. Introduction\n2. Conclusion' })
})
.then(res => res.json())
.then(data => console.log(data))
.catch(err => console.error(err));
