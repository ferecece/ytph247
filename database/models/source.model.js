import { Model, DataTypes } from 'sequelize';


export default function model(sequelize) {
	class Source extends Model {
        static associate(models) {
			const { user } = models;
			this.belongsTo(user);
        }
    }
	Source.init(
	{
        id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		},
		videoId: {
			allowNull: false,
			type: DataTypes.STRING(12)
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
		modelName: 'source',
	}
    );
};