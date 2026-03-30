const Joi = require('joi');

const validateJob = (req, res, next) => {
    const schema = Joi.object({
        title: Joi.string().required().min(3).max(100),
        description: Joi.string().required().min(10),
        requiredSkills: Joi.array().items(Joi.string()).min(1).required(),
        location: Joi.string(),
        salary: Joi.object({
            min: Joi.number(),
            max: Joi.number(),
            currency: Joi.string()
        })
    });

    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ error: error.details[0].message });
    }
    next();
};

module.exports = { validateJob };
