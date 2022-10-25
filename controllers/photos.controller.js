const Photo = require('../models/photo.model');
const Voter = require('../models/Voter.model')
const sanitize = require('mongo-sanitize');

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {

  try {
    const file = req.files.file;
    const title = sanitize(req.fields.title);
    const author = sanitize(req.fields.author);
    const email = req.fields.email;

    if (title && author && email && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExtend = fileName.split('.').slice(-1)[0];

      if (fileExtend === "jpg" || fileExtend === "png" || fileExtend === "gif") {
        const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      } else { throw new Error('Wrong input!') }; // new Error is an object, cant be parsed by json. Use object with err.message
    }
  } catch (err) {
    console.log('err: ', err.name);
    res.status(500).json({ error: err.message });
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {

  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }

};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {

  try {
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    const userIp = req.getIp

    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      const voterToUpdate = await Voter.findOne({ user: userIp });

      if (!voterToUpdate) {
        const newVoter = new Voter({ user: userIp, votes: [req.params.id] });
        await newVoter.save();
        photoToUpdate.votes++;
        photoToUpdate.save();
        res.send({ message: 'OK' });
      } else {
        const isNextVote = voterToUpdate.votes.indexOf(req.params.id);

        if (isNextVote === -1) {
          await voterToUpdate.votes.push(req.params.id);
          voterToUpdate.save();
          photoToUpdate.votes++;
          photoToUpdate.save();
          res.send({ message: 'OK' });
        } else {
          res.status(500).json({ message: 'You have already voted.'});//<======tego komunikatu nie widać nigdzie...
          //<===== jeżelie zaminie go na res.send({ message: "second time.."}) to zlicza głosy, po reload odejmuje
        }
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }

};
