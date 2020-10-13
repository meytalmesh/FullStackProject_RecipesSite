-- table for users
CREATE TABLE [dbo].[users]
(
    [user_id] [UNIQUEIDENTIFIER] NOT NULL default NEWID(),
    [username]    [varchar](10)   NOT NULL UNIQUE,
    [first_name]  [varchar](500)  NOT NULL,
    [last_name]   [varchar](500)  NOT NULL,
    [country]     [varchar](500)  NOT NULL,
    [password]    [varchar](3000) NOT NULL,
    [email]       [varchar](3000) NOT NULL UNIQUE,
    [picture_url] [varchar](3000) NOT NULL,

    PRIMARY KEY (user_id)
)



-- table of last viewed recipes by user
CREATE TABLE [dbo].[user_viewed_recipes]
(
    [username]   [varchar](10)   NOT NULL,
    [recipe_id]  [varchar](3000) NOT NULL,
    [time_stamp] datetime DEFAULT (getdate()),

    foreign key(username) references users(username)
)


-- table of user's favourites
CREATE TABLE [dbo].[user_saved_favourites]
(
    [username]  [varchar](10)   NOT NULL,
    [recipe_id] [varchar](3000) NOT NULL,

);

