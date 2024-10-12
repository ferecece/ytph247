import { Model, DataTypes } from 'sequelize';


export default function model(sequelize) {
	class User extends Model {
        static associate(models) {
			const { source, quote } = models;
			this.hasMany(source);
			this.hasMany(quote);
        }
    }
	User.init(
	{
        id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		userId: {
			allowNull: false,
			type: DataTypes.STRING,
		},
		videoSubmitCount: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
		quoteSubmitCount: {
			allowNull: false,
			type: DataTypes.INTEGER,
		},
	},
	// Lo que está aqui abajo siempre va no cambiar, solo cambiar
	// el nombre de Modelname
	{
		underscored: true,
		// esto tiene que ir o si no intentará hacer selects en un campo createdAt
		// que no tenemos
		timestamps: false,
		sequelize,
		freezeTableName: true,
		modelName: 'user',
	}
    );
};