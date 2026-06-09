SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[Loans](
    [Id] bigint IDENTITY(1,1) NOT NULL,
    [BookId] bigint NOT NULL,
    [MemberId] bigint NOT NULL,
    [LoanDate] datetimeoffset(7) NOT NULL,
    [DueDate] datetimeoffset(7) NOT NULL,
    [ReturnDate] datetimeoffset(7) NULL,
    [IsReturned] bit NOT NULL CONSTRAINT [DF_Loans_IsReturned] DEFAULT 0,
 CONSTRAINT [PK_Loans] PRIMARY KEY CLUSTERED
(
    [Id] ASC
) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[Loans] WITH CHECK ADD CONSTRAINT [FK_Loans_Books]
    FOREIGN KEY([BookId]) REFERENCES [dbo].[Books] ([Id])
GO

ALTER TABLE [dbo].[Loans] WITH CHECK ADD CONSTRAINT [FK_Loans_Members]
    FOREIGN KEY([MemberId]) REFERENCES [dbo].[Members] ([Id])
GO
