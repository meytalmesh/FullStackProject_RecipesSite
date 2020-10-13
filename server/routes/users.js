var express = require('express');
var router = express.Router();
var DButils = require('../DB/DButils');
var util = require('util');

const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get("/recipeInfo", async (req, res, next) => {
  try{
    const favoriteRecipes = await DButils.execQuery(`SELECT RecipeID FROM dbo.UserFavorites WHERE Username = '${req.body.username}'`);
    const viewsRecipes = await DButils.execQuery(`SELECT RecipeID FROM dbo.UserRecipeViews WHERE Username = '${req.body.username}'`);
    let ids=req.query.recipe_ids;
    let dic=[];
    ids.forEach(function (item, index,array) {
      let recipeID=item;
      let RecipeInfo={};
      let detail={};
      let watch="watch",favorite="favorite";
      detail[watch]=false;
      detail[favorite]=false;
      favoriteRecipes.forEach(function (item, index, array) {
        if(item.RecipeID==recipeID){
          detail[favorite]=true;
        }
      });
      viewsRecipes.forEach(function (item, index, array) {
        if(item.RecipeID==recipeID){
          detail[watch]=true;
        }
      });
      RecipeInfo[recipeID]=detail;
      dic.push(RecipeInfo);
    });


    res.send({ data: dic });
  }catch (e) {
    next(e);
  }
});

//3 last views
router.get("/lastViews", async (req, res, next) => {
  try{
    const favoriteRecipes = await DButils.execQuery(`SELECT TOP 3 * FROM dbo.UserRecipeViews WHERE Username = '${req.query.username}' 
    ORDER BY LastView DESC`);
    if(favoriteRecipes.length!=0) {
      res.status(200).send({data: favoriteRecipes});
    }
    res.status(404).send("Not Found");
  }
  catch (e) {
    next(e);
  }
});

router.post("/addFavoriteRecipe", async (req, res, next) => {
  try{
    var Username = req.query.username;
    var RecipeID = req.query.recipe_id;

    // parameters exists
    if(!(Username && RecipeID )){
      throw { status: 401, message: "Some details are missing" };
    }
    let recipeExist = await checkRecipeExist(req.query.recipe_id);
    if(!recipeExist){
      throw { status: 409, message: "recipe not exist" };
    }

    //add recipe
    await DButils.execQuery(
        `INSERT INTO dbo.UserFavorites (Username, RecipeID) VALUES ('${Username}', '${RecipeID}')`
    );
    res.status(201).send("recipe added to favorites");
  }  catch (e) {
    next(e);
  }

});

// add recipe to seen
router.post("/addView", async (req, res, next) => {
try{
  var Username = req.query.username;
  var RecipeID = req.query.recipe_id;

  // parameters exists
  if(!(Username && RecipeID )){
    throw { status: 401, message: "Some details are missing" };
  }

  let recipeExist = await checkRecipeExist(req.query.recipe_id);
  if(!recipeExist){
    throw { status: 409, message: "recipe no exist" };
  }


  const seen_recipes = await DButils.execQuery("select * from dbo.UserRecipeViews where Username = '" + Username + "' and RecipeID = '" + RecipeID +"'");

  if(seen_recipes.length == 0){

    await DButils.execQuery("INSERT INTO dbo.UserRecipeViews Values ('" + Username + "','" + RecipeID +"',"+Date.now()+")");
    res.status(201).send("recipe added to user views");
  }
  else{
    await DButils.execQuery("UPDATE dbo.UserRecipeViews SET LastView = "+Date.now()+" WHERE Username like '" + Username + "' and RecipeID like '" + RecipeID +"'");
    res.status(201).send("recipe last date is updated");
  }
}  catch (e) {
  next(e);
}


});

//get all user recipes
router.get("/MyRecipes", async (req, res, next) =>{
  try{
    const favoriteRecipes = await DButils.execQuery(`SELECT * FROM dbo.UserRecipes WHERE Username = '${req.body.username}'`);
    res.status(200).send({ data: favoriteRecipes });
  }
  catch (e) {
    next(e);
  }
});

//get all user family recipes
router.get("/MyFamilyRecipes", async (req, res, next) =>{
  try{
    const familyRecipes = await DButils.execQuery(`SELECT * FROM dbo.UserFamilyRecipes WHERE Username = '${req.body.username}'`);
    res.status(200).send({ data: familyRecipes });
  }
  catch (e) {
    next(e);
  }
});

async function checkRecipeExist(id) {
  let recipe= await axios.get(`${api_domain}/${id}/information`, {
    params: {
      includeNutrition: false,
      apiKey: process.env.spooncular_apiKey
    }
  })
      .then((recipe) =>{
        return true;
      })
      .catch(function (error){
        return false;
      });
  return recipe;
}

//User recipe..
// router.post("/addUserRecipe", async (req, res, next) => {
//   try{
//       let username=req.body.username;
//       let Recipe={};
//       let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//       const arr=[];
//       Recipe[title]= "Chocolate Cake";
//       Recipe[time]= 60;
//       Recipe [likes]= 0;
//       Recipe[vegetarian]= false;
//       Recipe[vegan]= false;
//       Recipe[glutenFree]= false;
//       Recipe[image]= null;
//       let name="name",amount="amount",unit="unit";
//
//       let ing1={};
//       ing1[name]="sugar";
//       ing1[amount]=2;
//       ing1[unit]="cups";
//       arr.push(ing1);
//
//     let ing2={};
//     ing2[name]="flour";
//     ing2[amount]=2;
//     ing2[unit]="cups";
//     arr.push(ing2);
//     let ing3={};
//     ing3[name]="coca powder";
//     ing3[amount]=1;
//     ing3[unit]="cups";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="baking powder";
//     ing4[amount]=1.5;
//     ing4[unit]="teaspoons";
//     arr.push(ing4);
//
//     let ing5={};
//     ing5[name]="baking soda";
//     ing5[amount]=1.5;
//     ing5[unit]="teaspoons";
//     arr.push(ing5);
//
//     let ing6={};
//     ing6[name]="salt";
//     ing6[amount]=1;
//     ing6[unit]="teaspoon";
//     arr.push(ing6);
//
//     let ing7={};
//     ing7[name]="egg";
//     ing7[amount]=2;
//     ing7[unit]="";
//     arr.push(ing7);
//
//
//       Recipe[ingredients]=arr
//       Recipe[instructions]= "Preheat oven to 350 degrees F (175 degrees C). Grease and flour two nine inch round pans.\nIn a large bowl, stir together the sugar, flour, cocoa, baking powder, baking soda and salt. Add the eggs, milk, oil and vanilla, mix for 2 minutes on medium speed of mixer. Stir in the boiling water last. Batter will be thin. Pour evenly into the prepared pans.\n" +
//           "Bake 30 to 35 minutes in the preheated oven, until the cake tests done with a toothpick. Cool in the pans for 10 minutes, then remove to a wire rack to cool completely.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Chocolate Cake', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


// router.post("/addUserRecipe", async (req, res, next) => {
//   try{
//     let username=req.body.username;
//     let Recipe={};
//     let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//     const arr=[];
//     Recipe[title]= "Pancakes";
//     Recipe[time]= 15;
//     Recipe [likes]= 0;
//     Recipe[vegetarian]= false;
//     Recipe[vegan]= false;
//     Recipe[glutenFree]= false;
//     Recipe[image]= null;
//     let name="name",amount="amount",unit="unit";
//
//     let ing1={};
//     ing1[name]="sugar";
//     ing1[amount]=1;
//     ing1[unit]="teaspoon";
//     arr.push(ing1);
//
//     let ing2={};
//     ing1[name]="flour";
//     ing1[amount]=1;
//     ing1[unit]="cups";
//     arr.push(ing2);
//
//     let ing3={};
//     ing3[name]="milk";
//     ing3[amount]=1;
//     ing3[unit]="cups";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="baking powder";
//     ing4[amount]=3;
//     ing4[unit]="teaspoons";
//     arr.push(ing4);
//
//     let ing5={};
//     ing5[name]="butter";
//     ing5[amount]=3;
//     ing5[unit]="teaspoon";
//     arr.push(ing5);
//
//     let ing6={};
//     ing6[name]="salt";
//     ing6[amount]=1;
//     ing6[unit]="teaspoon";
//     arr.push(ing6);
//
//     let ing7={};
//     ing7[name]="egg";
//     ing7[amount]=1;
//     ing7[unit]="";
//     arr.push(ing7);
//
//     Recipe[ingredients]=arr
//     Recipe[instructions]=
//         "In a large bowl, sift together the flour, baking powder, salt and sugar. Make a well in the center and pour in the milk, egg and melted butter; mix until smooth.\n" +
//         "Heat a lightly oiled griddle or frying pan over medium high heat. Pour or scoop the batter onto the griddle, using approximately 1/4 cup for each pancake. Brown on both sides and serve hot.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Pancakes', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


// router.post("/addUserRecipe", async (req, res, next) => {
//   try{
//     let username=req.body.username;
//     let Recipe={};
//     let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//     const arr=[];
//     Recipe[title]= 'Salad';
//     Recipe[time]= 20;
//     Recipe [likes]= 0;
//     Recipe[vegetarian]= true;
//     Recipe[vegan]= true;
//     Recipe[glutenFree]= true;
//     Recipe[image]= null;
//     let name="name",amount="amount",unit="unit";
//
//     let ing1={};
//     ing1[name]="tomatoes";
//     ing1[amount]=1;
//     ing1[unit]="cups";
//     arr.push(ing1);
//
//     let ing2={};
//     ing2[name]="red bell pepperr";
//     ing2[amount]=1;
//     ing2[unit]="cups";
//     arr.push(ing2);
//
//     let ing3={};
//     ing3[name]="Cucumbers";
//     ing3[amount]=1;
//     ing3[unit]="cups";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="lettuce";
//     ing4[amount]=2;
//     ing4[unit]="cups";
//     arr.push(ing4);
//
//     let ing5={};
//     ing5[name]="dressing";
//     ing5[amount]=5;
//     ing5[unit]="teaspoon";
//     arr.push(ing5);
//
//
//     Recipe[ingredients]=arr
//     Recipe[instructions]=
//         "Whisk together the salad spice mix and dressing.\n" +
//         "In a salad bowl, combine the vegtebles and Pour dressing over salad; toss and refrigerate overnight.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Salad', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


//User family recipe..
// router.post("/addUserRecipe", async (req, res, next) => {
//
//   try{
//     let username=req.body.username;
//
//     let Recipe={};
//
//     let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//     const arr=[];
//     Recipe[title]= 'Scrambled Eggs';
//     Recipe[time]= 10;
//     Recipe [likes]= 0;
//     Recipe[vegetarian]= true;
//     Recipe[vegan]= false;
//     Recipe[glutenFree]= true;
//     Recipe[image]= null;
//     let name="name",amount="amount",unit="unit";
//
//     let ing1={};
//     ing1[name]="butter";
//     ing1[amount]=2;
//     ing1[unit]="teaspoons";
//     arr.push(ing1);
//
//     let ing2={};
//     ing2[name]="aggs";
//     ing2[amount]=3;
//     ing2[unit]="aggs";
//     arr.push(ing2);
//
//     let ing3={};
//     ing3[name]="salt";
//     ing3[amount]=1;
//     ing3[unit]="teaspoons";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="milk";
//     ing4[amount]=2;
//     ing4[unit]="cups";
//     arr.push(ing4);
//
//
//     Recipe[ingredients]=arr
//     Recipe[instructions]=
//         "Pour melted butter into a glass 9x13 inch baking dish. In a large bowl, whisk together eggs and salt until well blended. Gradually whisk in milk. Pour egg mixture into the baking dish.\n" +
//         "Bake uncovered for 10 minutes, then stir, and bake an additional 10 to 15 minutes, or until eggs are set. Serve immediately.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserFamilyRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Scrambled Eggs', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


// router.post("/addUserRecipe", async (req, res, next) => {
//
//   try{
//     let username=req.body.username;
//
//     let Recipe={};
//
//     let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//     const arr=[];
//     Recipe[title]= 'Corn';
//     Recipe[time]= 10;
//     Recipe [likes]= 0;
//     Recipe[vegetarian]= true;
//     Recipe[vegan]= false;
//     Recipe[glutenFree]= true;
//     Recipe[image]= null;
//     let name="name",amount="amount",unit="unit";
//
//     let ing1={};
//     ing1[name]="sugar";
//     ing1[amount]=2;
//     ing1[unit]="teaspoons";
//     arr.push(ing1);
//
//     let ing2={};
//     ing2[name]="lemon";
//     ing2[amount]=1;
//     ing2[unit]="teaspoons";
//     arr.push(ing2);
//
//     let ing3={};
//     ing3[name]="corn";
//     ing3[amount]=6;
//     ing3[unit]="corn";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="butter";
//     ing4[amount]=1;
//     ing4[unit]="cups";
//     arr.push(ing4);
//
//
//     Recipe[ingredients]=arr
//     Recipe[instructions]=
//         "Fill a large pot about 3/4 full of water and bring to a boil.\n" +
//         "Stir in sugar and lemon juice, dissolving the sugar. Gently place ears of corn into boiling water, cover the pot, turn off the heat, and let the corn cook in the hot water until tender, about 10 minutes.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserFamilyRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Corn', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


// router.post("/addUserRecipe", async (req, res, next) => {
//
//   try{
//     let username=req.body.username;
//
//     let Recipe={};
//
//     let title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image",instructions="instructions",ingredients="ingredients";
//     const arr=[];
//     Recipe[title]= 'Milk Shake';
//     Recipe[time]= 10;
//     Recipe [likes]= 0;
//     Recipe[vegetarian]= true;
//     Recipe[vegan]= false;
//     Recipe[glutenFree]= true;
//     Recipe[image]= null;
//     let name="name",amount="amount",unit="unit";
//
//     let ing1={};
//     ing1[name]="ice cream";
//     ing1[amount]=2;
//     ing1[unit]="cups";
//     arr.push(ing1);
//
//     let ing2={};
//     ing2[name]="milk";
//     ing2[amount]=1;
//     ing2[unit]="cup";
//     arr.push(ing2);
//
//     let ing3={};
//     ing3[name]="honey";
//     ing3[amount]=1;
//     ing3[unit]="teaspoon";
//     arr.push(ing3);
//
//     let ing4={};
//     ing4[name]="strawberries";
//     ing4[amount]=1;
//     ing4[unit]="cup";
//     arr.push(ing4);
//
//
//     Recipe[ingredients]=arr
//     Recipe[instructions]=
//         "In a blender, combine milk, honey, vanilla and frozen strawberries.\n" +
//         "Blend until smooth. Pour into glasses and serve.";
//     let str=Object.entries(Recipe).map(([key, value]) => ({key,value}));
//     let json=JSON.stringify(str);
//     // console.log(json);
//     await DButils.execQuery(
//         `INSERT INTO dbo.UserFamilyRecipes (Username, RecipeTitle,RecipeData) VALUES ('${username}', 'Milk Shake', '${json}')`
//     );
//
//     res.status(201).send({data: Recipe});
//   }  catch (e) {
//     next(e);
//   }
//
// });


module.exports = router;
