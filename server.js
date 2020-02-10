const express = require("express");
const { todos } = require("./db/db");
const bodyParser = require("body-parser");
const cors = require("cors");
// Set up the express app
const app = express();

const expectedSentence1 = {
  sentenceOne: "Hello, my name is Baby Yoda."
};

function upperCaseArray(theArray) {
  let newArray = [];
  for (let index = 0; index < theArray.length; index++) {
    const element = theArray[index];
    newArray.push(element.toUpperCase());
  }
  return newArray;
}

function getExtraWords(expectedWords, actualWords) {
  if (actualWords) {
    let upperExpected = upperCaseArray(expectedWords);
    let upperActual = upperCaseArray(actualWords);

    let extraWords = [];
    for (let index = 0; index < upperActual.length; index++) {
      const word = upperActual[index];
      if (!upperExpected.includes(word)) {
        extraWords.push(actualWords[index]);
      }
    } //for
    return extraWords;
  } //if
  else {
    return [];
  }
}

function getMissingWords(expectedWords, actualWords) {
  if (actualWords) {
    let upperExpected = upperCaseArray(expectedWords);
    let upperActual = upperCaseArray(actualWords);
    let missingWords = [];
    for (let index = 0; index < upperExpected.length; index++) {
      const word = upperExpected[index];
      if (!upperActual.includes(word)) {
        missingWords.push(expectedWords[index]);
      }
    } //for
    return missingWords;
  } //if
  else {
    return expectedWords;
  }
}

/*
  Only call if array are of same length
*/
function getOutOfOrder(expectedWords, actualWords) {
  if (actualWords) {
    let upperExpected = upperCaseArray(expectedWords);
    let upperActual = upperCaseArray(actualWords);
    let outOfOrder = [];
    for (let index = 0; index < upperExpected.length; index++) {
      if (upperExpected[index] !== upperActual[index]) {
        outOfOrder.push(actualWords[index]);
      }
    } //for
    return outOfOrder;
  } //if
  else {
    return [];
  }
}

function getIndexOfWord(wordInUppercase, theArrayNotInUppercase) {
  let foundIndex = -1;

  for (let index = 0; index < theArrayNotInUppercase.length; index++) {
    const word = theArrayNotInUppercase[index];
    if (wordInUppercase === word.toUpperCase()) {
      foundIndex = index;
    }
  }

  return foundIndex;
}

/*
  If the arrays have a common word, and the user input word is not in the same case 
  as the expected word, this function returns this word as in wrong case.
*/
function getWrongCase(expectedWords, actualWords) {
  if (actualWords) {
    let upperExpected = upperCaseArray(expectedWords);
    let upperActual = upperCaseArray(actualWords);
    let wrongCaseWords = [];
    for (let index = 0; index < upperExpected.length; index++) {
      const word = upperExpected[index];
      if (upperActual.includes(word)) {
        let foundIndex = getIndexOfWord(word, actualWords);
        let actualWord = actualWords[foundIndex];
        let expectedWord = expectedWords[index];
        if (expectedWord !== actualWord) {
          wrongCaseWords.push(actualWord);
        }
      }
    } //for
    return wrongCaseWords;
  } //if
  else {
    return [];
  }
}

function isSeparatorChar(someChar) {
  let seps = [".", ",", ":", ";", "?", "!", " "];

  return seps.includes(someChar);
}
function splitWordsAndPunctuation(someText) {
  let words = []; // will contain words separated from punctuation and spaces

  //perform separation
  let characters = someText.split(""); //split into individual characters
  ////console.log(characters);
  let nonPunctionChars = [];

  for (let index1 = 0; index1 < characters.length; index1++) {
    const character = characters[index1];

    if (!isSeparatorChar(character)) {
      //console.log(`hit char ${character}`);
      nonPunctionChars.push(character); //we hit non punc character
    } //if
    else {
      //console.log(`hit punctuation '${character}'`);
      // hit a punctuation character

      if (nonPunctionChars.length > 0) {
        let word = nonPunctionChars.join(""); //create string from all chars
        //console.log(`created word ${word}`);
        words.push(word); //add word to word array
        words.push(character); // add punctuation to word array
        nonPunctionChars = []; //reset non punc chars array to empty
      } //if
    } //endif
  } //for

  // what if we don't hit any punctuation... we need to create a sentence frag
  if (nonPunctionChars.length > 0) {
    let word = nonPunctionChars.join(""); //create string from all chars
    words.push(word); //add word to word array
  }

  //console.log(`1st parsed data: ${words}`);

  // // now we have sentence pieces separate from punctuation and spaces
  // // split sentence pieces with spaces
  // let words2 = [];
  // for (let index = 0; index < words.length; index++) {
  //   const element = words[index];
  //   if (isSeparatorChar(element)) {
  //     //console.log(`is separator '${element}'`);
  //     words2.push(element);
  //   } else {
  //     //this is not a punctuation piece
  //     let someWords = element.split(uniqueReplacementForSpaces);
  //     for (let index2 = 0; index2 < someWords.length; index2++) {
  //       const someWord = someWords[index2];
  //       //console.log(`pushing word: ${someWord}`);
  //       words2.push(someWord);
  //     } //for
  //   }
  // } //for

  //console.log(`returning words :`);
  for (let index = 0; index < words.length; index++) {
    const element = words[index];
    //console.log(`word : '${words[index]}'`);
  }
  return words;
}

function validateParagraph(inputText) {
  let userWords = splitWordsAndPunctuation(inputText);
  let expectedWords = splitWordsAndPunctuation(expectedSentence1.sentenceOne);

  //console.log(`user     words: ${userWords.length}`);
  //console.log(`expected words: ${expectedWords.length}`);

  let errors = [];

  if (expectedWords.length !== userWords.length) {
    let error1 = {
      errorCode: "WORD_COUNT_MISMATCH",
      errorMessage: `Expected ${expectedWords.length} but received ${userWords.length}`
    };
    errors.push(error1);
  }

  let extraWords = getExtraWords(expectedWords, userWords);

  if (extraWords.length > 0) {
    let error2 = {
      errorCode: "UNEXPECTED_WORDS",
      errorMessage: `Unexpected words found`,
      unexpectedWords: extraWords
    };
    errors.push(error2);
  }

  let missingWords = getMissingWords(expectedWords, userWords);
  if (missingWords.length > 0) {
    let error3 = {
      errorCode: "MISSING_WORDS",
      errorMessage: `Missing words found`,
      missingWords: missingWords
    };
    errors.push(error3);
  }

  if (extraWords.length == 0 && missingWords.length == 0) {
    // arrays have same words. let's see if they are in order
    let outOfOrderWords = getOutOfOrder(expectedWords, userWords);
    if (outOfOrderWords.length > 0) {
      let error4 = {
        errorCode: "OUTOFORDER_WORDS",
        errorMessage: `Some words out of order`,
        outOfOrderWords: outOfOrderWords
      };
      errors.push(error4);
    }
  } //if

  // let's check spelling of common words
  let wrongCaseWords = getWrongCase(expectedWords, userWords);
  if (wrongCaseWords.length > 0) {
    let error5 = {
      errorCode: "WRONGCASE_WORDS",
      errorMessage: `Some words not in proper case`,
      wrongCaseWords: wrongCaseWords
    };
    errors.push(error5);
  }

  let results = {};

  if (errors.length > 0) {
    results.validationCode = "FAILURE";
    results.message = `There were ${errors.length} validation errors.`;
    results.errors = errors;
    (results.actualParagraph = inputText),
      (results.expectedParagraph = expectedSentence1.sentenceOne);
  } else {
    (results.actualParagraph = inputText),
      (results.expectedParagraph = expectedSentence1.sentenceOne);
    results.validationCode = "SUCCESS";
    results.message = "No validation errors found.";
  }

  return results;
}

app.use(cors());
// Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// get all todos
app.get("/api/v1/todos", (req, res) => {
  res.status(200).send({
    success: "true",
    message: "todos retrieved successfully",
    todos: todos
  });
});

app.post("/api/v1/todos", (req, res) => {
  if (!req.body.title) {
    return res.status(400).send({
      success: "false",
      message: "title is required"
    });
  } else if (!req.body.description) {
    return res.status(400).send({
      success: "false",
      message: "description is required"
    });
  }
  const todo = {
    id: todos.length + 1,
    title: req.body.title,
    description: req.body.description
  };
  todos.push(todo);
  return res.status(201).send({
    success: "true",
    message: "todo added successfully",
    todo
  });
});

app.post("/api/v1/grammarcheck", (req, res) => {
  if (!req.body.theParagraph) {
    return res.status(400).send({
      validationCode: "FAILURE",
      message: "'theParagraph' field is required"
    });
  }

  return res.status(200).send(validateParagraph(req.body.theParagraph));
});

const PORT = 8080;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});
