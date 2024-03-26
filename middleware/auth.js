import {getUsersByEmail} from "../functions.js"


export async function auth(req, res, next) {
  const email = req.headers['authorization']
  
  if (!email) {
    return res.status(401).json({ error: 'Authorization header missing or invalid' }); 
  }
  
  try {
    const user = await getUsersByEmail(email);
     if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    req.user = user; 

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Server Error' });
  }
}