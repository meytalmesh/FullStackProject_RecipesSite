--table of family recipes
CREATE TABLE [dbo].[familyRecipes]
(
    [username]    [varchar](10)   NOT NULL,
    [recipe_text] [nvarchar](max) not null,
)


--table of personal recipes
CREATE TABLE [dbo].[personalRecipes]
(
    [username]    [varchar](10)   NOT NULL,
    [recipe_text] [nvarchar](max)  not null,

)