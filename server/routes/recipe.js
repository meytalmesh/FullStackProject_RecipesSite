var express = require('express');
var router = express.Router();

const axios = require("axios");
const api_domain = "https://api.spoonacular.com/recipes";
var lastSearch="";

// router.get("/test", async (req, res, next) => {
//     try {
//         // var t= recipes[0].data.title;
//         let Recipe={};
//         let id="id", name="name",glutenFree="glutenFree", instraction="instraction";
//         Recipe[id]=100;
//         Recipe[name]="cake";
//         Recipe[glutenFree]=false;
//         let ist1={id: 1, data: "test1"};
//         let ist2={id: 2, data: "test2"};
//         let ist3={id: 3, data: "test3"};
//         Recipe[instraction]=[];
//         Recipe[instraction].push(ist1);
//         Recipe[instraction].push(ist2);
//         Recipe[instraction].push(ist3);
//         console.log(Recipe);
//         console.log(Recipe[id]);
//         console.log(Recipe[name]);
//         console.log(Recipe[glutenFree]);
//         console.log(Recipe[instraction]);
//         console.log("Access!!!!!!!!!!!!!");
//         console.log(Recipe[instraction][0]);
//         console.log(Recipe[instraction][0].id);
//         console.log(Recipe[instraction][0].data);
//
//         let json=JSON.stringify(Recipe);
//         console.log("json file????????????");
//         console.log(json);
//         res.status(200).send({ Recipe: Recipe });
//     } catch (error) {
//         next(error);
//     }
// });
//
// router.get("/test1", async (req, res, next) => {
//     try {
//         const arr=[];
//         // arr[1]="test1";
//         // arr[2]="test2";
//         // arr[3]="test3";
//         const recipe = await getRecipeInfo(req.query.recipe_id);
//         let t=getAllRecipeInformation(recipe.data)
//         console.log(t);
//         res.status(200).send({ data: "recipe" });
//     } catch (error) {
//         next(error);
//     }
// });

router.get("/Information", async (req, res, next) => {
    try {
        const recipe = await getRecipeInfo(req.query.recipe_id);

        if(recipe.data.length==0){
            res.status(404).send("Recipe dont found");
        }
        let allData=getAllRecipeInformation(recipe.data)
        res.status(200).send({ data: allData });
    } catch (error) {
        next(error);
    }
});

router.get("/search", async (req, res, next) => {
    try {
        const { query, cuisine, diet, intolerances, number } = req.query;
        const search_response = await axios.get(`${api_domain}/search`, {
            params: {
                query: query,
                cuisine: cuisine,
                diet: diet,
                intolerances: intolerances,
                number: number,
                instructionsRequired: true,
                apiKey: process.env.spooncular_apiKey
            }
        });
        let recipes = await Promise.all(
            search_response.data.results.map((recipe_raw) =>
                getRecipePreview(recipe_raw.id)
            )
        );

        // recipes = recipes.map((recipe) => recipe.data);
        lastSearch=recipes;
        res.send({ data: recipes });
    } catch (error) {
        next(error);
    }
});

router.get("/random", async (req, res, next) => {
    try {
        const random_response = await axios.get(`${api_domain}/random`, {
            params: {
                limitLicense: true,
                number: 3,
                apiKey: process.env.spooncular_apiKey
            }
        });
        let recipes = await Promise.all(
            random_response.data.recipes.map((recipe_raw) =>
                RecipePreview(recipe_raw)
            )
        );
        res.status(200).send({ data: recipes });
    } catch (error) {
        next(error);
    }
});

router.get("/lastSearch",(req, res, next) => {
    if(lastSearch.length==0){
        res.status(201).send("Last search doesn't exist");
    }
    res.status(200).send({data: lastSearch});
} );

function getRecipeInfo(id) {
    return axios.get(`${api_domain}/${id}/information`, {
        params: {
            includeNutrition: false,
            apiKey: process.env.spooncular_apiKey
        }
    });
}

async function getRecipePreview(recipe_id){
    let recipe= await getRecipeInfo(recipe_id);
    if(recipe.data.length==0){
        res.status(404).send("Recipe dont found");
    }
    let Recipe={};
    let id="id",title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image";
    Recipe[id]= recipe.data.id;
    Recipe[title]= recipe.data.title;
    Recipe[time]= recipe.data.readyInMinutes;
    Recipe [likes]= recipe.data.aggregateLikes;
    Recipe[vegetarian]= recipe.data.vegetarian;
    Recipe[vegan]= recipe.data.vegan;
    Recipe[glutenFree]= recipe.data.glutenFree;
    Recipe[image]= recipe.data.image;

    return Recipe;
}
function RecipePreview(recipe){

    let Recipe={};
    let id="id",title="title",time="time",likes="likes",vegetarian="vegetarian",vegan="vegan",glutenFree="glutenFree",image="image";
    Recipe[id]= recipe.id;
    Recipe[title]= recipe.title;
    Recipe[time]= recipe.readyInMinutes;
    Recipe [likes]= recipe.aggregateLikes;
    Recipe[vegetarian]= recipe.vegetarian;
    Recipe[vegan]= recipe.vegan;
    Recipe[glutenFree]= recipe.glutenFree;
    Recipe[image]= recipe.image;

    return Recipe;
}
function getIngredients(ingredient){
    let Ingredients={};
    let name="name",amount="amount",unit="unit";
    Ingredients[name]=ingredient.name;
    Ingredients[amount]=ingredient.amount;
    Ingredients[unit]=ingredient.unit;
    return Ingredients;
}
function getAllRecipeInformation(recipe){
    let Recipe=RecipePreview(recipe);
    let instructions="instructions", ingredients="ingredients";
    const arr=[];
    if (recipe.extendedIngredients!=null) {
        recipe.extendedIngredients.forEach(function (item, index, array) {
            arr[index] = getIngredients(item);
        });
    }
    Recipe[ingredients]=arr;
    Recipe[instructions]=recipe.instructions;
    return Recipe;

}

module.exports = router;