const Photo = require('../models/photo.model');
const requestIp = require('request-ip');
const Voter = require('../models/Voter.model');

/****** SUBMIT PHOTO ********/

const escape = html => {
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

exports.add = async (req, res) => {

  try {
    const { title, author, email } = req.fields;

    const correctTitle = escape(title);
    const correctAuthor = escape(author);
    const correctEmail = escape(email);

    const file = req.files.file;

    if (correctTitle && correctAuthor && correctEmail && file) { // if fields are not empty...

      const fileName = file.path.split('/').slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split('.').slice(-1)[0];

      if (!['jpg', 'png', 'gif'].includes(fileExt)) {
        return res.status(415).json({ message: 'Unsupported file type!' });
      }

      if (title.length > 25) {
        return res.status(400).json({ message: 'Title exceeds the 25 character limit!' });
      }

      if (author.length > 50) {
        return res.status(400).json({ message: 'Author name exceeds the 50 character limit!' });
      }
      //if(fileExt === 'jpg' || fileExt === 'png' || fileExt === 'gif') {
      const newPhoto = new Photo({ title, author, email, src: fileName, votes: 0 });
      await newPhoto.save(); // ...save new photo in DB
      res.json(newPhoto);
      //} else {
      //  throw new Error('Wrong file type!');
      //}

    } else {
      throw new Error('Wrong input!');
    }

  } catch (err) {
    res.status(500).json(err);
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
  const voterIp = requestIp.getClientIp(req);
  try {
    let voter = await Voter.findOne({ user: voterIp });
    if (!voter) {
      voter = new Voter({ user: voterIp });
    }
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });
    if (!photoToUpdate) res.status(404).json({ message: 'Not found' });
    else {
      if (!voter.votes.includes(photoToUpdate.id)) {
        photoToUpdate.votes++;
        voter.votes.push(photoToUpdate.id);
        photoToUpdate.save();
      } else {
        res.json({ msg: 'What makes you think you will vote twice?!'})
      }
      res.send({ message: 'OK' });
    }
  } catch (err) {
    res.status(500).json(err);
  }

};
