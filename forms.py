from flask_wtf import FlaskForm
from flask_wtf.file import FileAllowed, FileField
from wtforms import DecimalField, PasswordField, SelectField, StringField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, Length, NumberRange, Optional

CLOTH_CATEGORIES = ["Tops", "Bottoms", "Dresses", "Outerwear", "Footwear", "Accessories"]


class RegisterForm(FlaskForm):
    store_name = StringField("Store name", validators=[DataRequired(), Length(max=120)])
    name = StringField("Your name", validators=[DataRequired(), Length(max=120)])
    email = StringField("Email", validators=[DataRequired(), Email(), Length(max=255)])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8, max=128)])
    confirm_password = PasswordField(
        "Confirm password",
        validators=[DataRequired(), EqualTo("password", message="Passwords must match.")],
    )


class LoginForm(FlaskForm):
    email = StringField("Email", validators=[DataRequired(), Email()])
    password = PasswordField("Password", validators=[DataRequired()])


class ClothForm(FlaskForm):
    name = StringField("Name", validators=[DataRequired(), Length(max=150)])
    category = SelectField(
        "Category", choices=[(c, c) for c in CLOTH_CATEGORIES], validators=[DataRequired()]
    )
    price = DecimalField("Price ($)", places=2, validators=[DataRequired(), NumberRange(min=0)])
    size = StringField("Size", validators=[Optional(), Length(max=20)])
    color = StringField("Color", validators=[Optional(), Length(max=40)])
    description = TextAreaField("Description", validators=[Optional(), Length(max=2000)])
    image = FileField("Photo", validators=[FileAllowed(["jpg", "jpeg", "png", "webp"], "Images only.")])
