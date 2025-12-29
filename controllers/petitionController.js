const { db, admin } = require('../middleware/auth');

exports.getAllPetitions = async (req, res) => {
  try {
    const petitionsSnapshot = await db.collection('petitions')
      .orderBy('createdAt', 'desc')
      .get();
    
    const petitions = [];
    petitionsSnapshot.forEach(doc => {
      petitions.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ success: true, data: petitions });
  } catch (error) {
    console.error('Get petitions error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getPetitionById = async (req, res) => {
  try {
    const petitionDoc = await db.collection('petitions').doc(req.params.id).get();
    
    if (!petitionDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Petition not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        id: petitionDoc.id,
        ...petitionDoc.data()
      }
    });
  } catch (error) {
    console.error('Get petition error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createPetition = async (req, res) => {
  try {
    const { title, description, goal, image } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title and description are required' 
      });
    }

    const petitionData = {
      title,
      description,
      goal: goal || 1000,
      signatures: 1,
      signedBy: [req.user.id],
      createdBy: req.user.id,
      image: image || 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=500&q=60',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('petitions').add(petitionData);

    res.status(201).json({ 
      success: true, 
      data: {
        id: docRef.id,
        ...petitionData
      }
    });
  } catch (error) {
    console.error('Create petition error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.signPetition = async (req, res) => {
  try {
    const petitionRef = db.collection('petitions').doc(req.params.id);
    const petitionDoc = await petitionRef.get();
    
    if (!petitionDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Petition not found' 
      });
    }

    const petitionData = petitionDoc.data();

    if (petitionData.signedBy && petitionData.signedBy.includes(req.user.id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'You have already signed this petition' 
      });
    }

    await petitionRef.update({
      signatures: admin.firestore.FieldValue.increment(1),
      signedBy: admin.firestore.FieldValue.arrayUnion(req.user.id)
    });

    res.json({ 
      success: true, 
      message: 'Petition signed successfully' 
    });
  } catch (error) {
    console.error('Sign petition error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
