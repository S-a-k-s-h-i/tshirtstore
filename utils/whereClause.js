//base - Product.find()
//base - Product.find(email:{'sakshi@13.dev'})

//bigQ - //search=code&category=shortsleeves&rating[gte]=4&price[lte]=999&price[gte]=199&limit=5

class WhereClause {
  constructor(base, bigQ) {
    this.base = base;
    this.bigQ = bigQ;
  }

  search() {
    const searchword = this.bigQ.search
      ? {
          name: {
            $regex: this.bigQ.search,
            $options: "i",
          },
        }
      : {};

    this.base = this.base.find({ ...searchword });
    return this;
  }

  pager(resulperPage) {
    let currentPage = 1;
    if (this.bigQ.page) {
      currentPage = this.bigQ.page;
    }
    const skipVal = resulperPage * (currentPage - 1);
    //1st page - skipVal=5*(1-1)=0
    //2nd page - skipVal=5*(2-1)=5

    this.base = this.base.limit(resulperPage).skip(skipVal);
    return this;
  }

  filter() {
    const copyQ = { ...this.bigQ };

    delete copyQ["search"];
    delete copyQ["limit"];
    delete copyQ["page"];

    //convert bigQ into a string=> copyQ
    let stringOfCopyQ = JSON.stringify(copyQ);

    stringOfCopyQ = stringOfCopyQ.replace(
      /\b(gte|lte|gt|lt)\b/g,
      (m) => `$${m}`
    );

    const jsonOfCopyQ = JSON.parse(stringOfCopyQ);

    this.base = this.base.find(jsonOfCopyQ);

    return this;
  }
}

module.exports = WhereClause;
