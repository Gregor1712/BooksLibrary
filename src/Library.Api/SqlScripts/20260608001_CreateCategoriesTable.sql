SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Categories](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [Name] nvarchar(255) NOT NULL,
    [Description] nvarchar(500) NULL,
 CONSTRAINT [PK_Categories] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO
