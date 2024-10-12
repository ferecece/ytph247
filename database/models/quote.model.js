import { Model, DataTypes } from 'sequelize';


export default function model(sequelize) {
	class Quote extends Model {
        static associate(models) {
			const { user } = models;
			this.belongsTo(user);
        }
    }
	Quote.init(
	{
        id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		quote: {
			allowNull: false,
			type: DataTypes.STRING(255)
		},
		count: {
		 	allowNull: false,
		 	type: DataTypes.INTEGER,
		},
		userId: {
			allowNull: false,
			type: DataTypes.INTEGER,
	   	},
	},
	{
		underscored: true,
		timestamps: false,
		sequelize,
		freezeTableName: true,
		modelName: 'quote',
	}
    );
};