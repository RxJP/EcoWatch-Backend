const { admin, db } = require('../middleware/auth');

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide name, email, and password' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters' 
      });
    }

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    // Create user profile in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      signedPetitions: []
    });

    // Create custom token
    const customToken = await admin.auth().createCustomToken(userRecord.uid);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        id: userRecord.uid,
        name,
        email,
        token: customToken
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    
    if (error.code === 'auth/email-already-exists') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already registered' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        id: req.user.id,
        ...userDoc.data()
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    
    await db.collection('users').doc(req.user.id).update({
      name,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ 
      success: true, 
      message: 'Profile updated successfully' 
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};
