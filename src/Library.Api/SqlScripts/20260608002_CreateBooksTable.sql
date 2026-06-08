SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Books](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [Title] nvarchar(255) NOT NULL,
    [Author] nvarchar(255) NOT NULL,
    [ISBN] nvarchar(20) NOT NULL,
    [Year] int NOT NULL,
    [CategoryId] bigint NOT NULL,
    [IsAvailable] bit NOT NULL CONSTRAINT [DF_Books_IsAvailable] DEFAULT 1,
    [Created] datetimeoffset(7) NULL,
    [LastChange] datetimeoffset(7) NULL,
 CONSTRAINT [PK_Books] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Books] WITH CHECK ADD CONSTRAINT [FK_Books_Categories]
    FOREIGN KEY([CategoryId]) REFERENCES [dbo].[Categories] ([Id])
GO
