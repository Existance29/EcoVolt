const validateSchema = async (req,res,schema) =>{
    //validate 
    //abort early set to false since we want to get all validation errors
    try{
      await schema.validateAsync(req.body, { abortEarly: false })
    }catch(err){
      //get the field and the error message
      const errors = err.details.map((error) => [error.path[0], error.message])
      res.status(400).json({ message: "Validation error", errors }) //add the validation errors to the json
      return false
    }
    return true
}

module.exports = validateSchema