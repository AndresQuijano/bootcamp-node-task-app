const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Task = require('./task');

const userSchema = mongoose.Schema({
    'name': {
        'type': String,
        'required': true,
        'trim': true
    },
    'age': {
        'type': Number,
        'default': 0,
        validate(value) {
            if (value < 0) {
                throw new Error('Age must be a positive number');
            }
        }
    },
    'email': {
        'type': String,
        'unique':true,
        'dropDups':true,
        'required': true,
        'trim': true,
        'lowercase': true,
        validate(value) {
            if (!validator.isEmail(value)) {
                throw new Error('Email is invalid');
            }
        }
    },
    'password': {
        'type': String,
        'required': true,
        'trim': true,
        'minLength': 7,
        validate(value) {
            if (value.toLowerCase().includes('password')) {
                throw new Error('Password cannot contain "password"');
            }
        }
    }, 
    'tokens':[{
        'token':{
            'type':String,
            'required':true
        }
    }],
    'avatar':{
        'type':Buffer
    }
},
{
    'timestamps': true//Creates the creation and update timestamps for every user automatically
});

userSchema.virtual('tasks', {
    'ref':'Task',
    'localField':'_id',
    'foreignField':'owner'
});

userSchema.methods.generateAuthToken = async function(){
    const user = this;

    const token = jwt.sign({'_id':user.id.toString()}, process.env.GWT_SECRET);

    user.tokens = user.tokens.concat({token});
    await user.save();

    return token;
};

//This is gonna be called when .send(user) is invoked
userSchema.methods.toJSON = function(){
    const user = this;
    const userObject = user.toObject();

    delete userObject.password;
    delete userObject.tokens;
    delete userObject.avatar;

    return userObject;
}

userSchema.statics.findByCredentials = async (email, password) => {
    const user = await User.findOne({email});
    console.log('User found: ',user);

    if(!user){
        throw new Error('User or password incorrect!');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        throw new Error('User or password incorrect!');
    }

    console.log('User:', user);
    return user;
};

//Hash a password
userSchema.pre('save', async function (next) {
    const user = this;

    console.log('Just before saving!');

    if (user.isModified('password')) {
        user.password = await bcrypt.hash(user.password, 8);
    }

    next();
});

//Delete user tasks when user is removed
userSchema.pre('remove', async function(next){
    const user = this;

    await Task.deleteMany({'owner':user._id});

    next();
});

userSchema.index({email: 1}, {unique: true});

const User = mongoose.model('User', userSchema);
User.createIndexes();

module.exports = User;