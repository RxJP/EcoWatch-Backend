const { db } = require('../middleware/auth');

exports.getAllZones = async (req, res) => {
  try {
    const zonesSnapshot = await db.collection('zones').get();
    
    const zones = [];
    zonesSnapshot.forEach(doc => {
      zones.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ success: true, data: zones });
  } catch (error) {
    console.error('Get zones error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getZoneById = async (req, res) => {
  try {
    const zoneDoc = await db.collection('zones').doc(req.params.id).get();
    
    if (!zoneDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Zone not found' 
      });
    }

    res.json({ 
      success: true, 
      data: {
        id: zoneDoc.id,
        ...zoneDoc.data()
      }
    });
  } catch (error) {
    console.error('Get zone error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};