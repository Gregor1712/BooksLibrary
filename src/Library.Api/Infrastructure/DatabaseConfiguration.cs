using Kros.KORM;
using Kros.KORM.Metadata;
using Library.Api.Domain;

namespace Library.Api.Infrastructure;

public class DatabaseConfiguration : DatabaseConfigurationBase
{
    internal const string CategoriesTableName = "Categories";
    internal const string BooksTableName = "Books";
    internal const string MembersTableName = "Members";
    internal const string LoansTableName = "Loans";

    public override void OnModelCreating(ModelConfigurationBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>()
            .HasTableName(CategoriesTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Book>()
            .HasTableName(BooksTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Member>()
            .HasTableName(MembersTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();

        modelBuilder.Entity<Loan>()
            .HasTableName(LoansTableName)
            .HasPrimaryKey(f => f.Id).AutoIncrement();
    }
}
