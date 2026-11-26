import React from 'react';
import { SettingsInfoPage } from '../../../src/features/settings/SettingsInfoPage';

const sections = [
    {
        title: 'Responsable du traitement',
        body: 'À compléter avant publication : nom ou raison sociale du responsable du traitement, adresse postale et adresse e-mail de contact. Indiquez également les coordonnées du délégué à la protection des données, s’il en a été désigné un. Cette notice ne peut pas être considérée comme définitive avant ces vérifications.',
    },
    {
        title: 'Finalités et bases juridiques',
        body: 'SeniorCare utilise les données pour créer et sécuriser les comptes, relier un senior à ses proches, gérer les pointages quotidiens, transmettre les alertes d’urgence aux proches autorisés, permettre l’échange de messages vocaux et de photos, gérer les contacts du senior et proposer un rappel local de pointage configurable. Les bases juridiques doivent être confirmées par le responsable : l’exécution du service peut relever de l’article 6(1)(b) du RGPD si elle est prévue par les conditions du service; les fonctions facultatives peuvent nécessiter un consentement. Un pointage « Pas très en forme » peut révéler une donnée de santé : une condition de l’article 9 du RGPD est alors nécessaire. Le consentement explicite prévu à l’article 9(2)(a) est une option à valider et à recueillir avant traitement; l’application ne comporte actuellement pas d’étape dédiée à ce consentement.',
    },
    {
        title: 'Données collectées',
        body: 'Compte : nom, adresse e-mail, rôle, identifiant, code d’invitation et empreinte du mot de passe. Suivi : statut et date des pointages, notes libres, statut, message et dates des alertes. Relations et contacts : liens entre comptes, noms, numéros de téléphone et e-mails des contacts saisis. Échanges : photos, messages vocaux, légendes, dates associées, identité de l’expéditeur, durée et métadonnées techniques des fichiers. Le rappel est enregistré sur l’appareil. L’application ne demande pas actuellement la position GPS lors d’un SOS.',
    },
    {
        title: 'Destinataires et prestataires',
        body: 'Les pointages, alertes et contenus sont accessibles au senior concerné et aux proches qui lui sont effectivement liés, selon les permissions de l’application. Les personnes habilitées à exploiter le service peuvent y accéder uniquement pour leurs missions. L’hébergeur de l’API et de la base de données ainsi que le prestataire de stockage des fichiers peuvent traiter les données pour le compte du responsable : leurs noms, rôles et lieux de traitement restent à renseigner. Le rappel quotidien est une notification locale gérée par le système du téléphone; il n’est pas envoyé au serveur comme notification push.',
    },
    {
        title: 'Durées de conservation',
        body: 'Les durées exactes et les règles d’archivage doivent être fixées et publiées par le responsable. À ce jour, l’application ne prévoit ni purge automatique ni suppression autonome de compte. Un proche lié peut supprimer un pointage et un message vocal; le senior peut supprimer un contact. La suppression des photos et celle du compte ne sont pas proposées dans l’application. Les données peuvent donc rester stockées tant qu’une procédure de suppression et une durée de conservation ne sont pas définies et mises en œuvre.',
    },
    {
        title: 'Hébergement et localisation',
        body: 'En développement, la base PostgreSQL et les fichiers peuvent être hébergés localement. En production, la base et les sauvegardes dépendent de l’hébergeur choisi; les photos et messages vocaux peuvent être stockés localement ou dans un stockage compatible S3 configuré par l’exploitant. À compléter avant publication : noms des fournisseurs, pays et régions de la base, des fichiers et des sauvegardes, éventuels transferts hors Espace économique européen et garanties applicables.',
    },
    {
        title: 'Vos droits',
        body: 'Dans les conditions prévues par le RGPD, vous pouvez demander l’accès à vos données, leur rectification, leur effacement, la limitation du traitement, vous opposer à certains traitements et obtenir la portabilité des données que vous avez fournies. Vous pouvez retirer un consentement à tout moment lorsque le traitement repose sur celui-ci; ce retrait ne remet pas en cause les traitements antérieurs. Certains droits peuvent être limités par une obligation légale ou les droits d’autrui. Les modalités de rectification et d’effacement doivent être précisées, car toutes les fonctions ne sont pas disponibles dans l’application.',
    },
    {
        title: 'Exercer vos droits',
        body: 'Adressez votre demande à l’adresse de contact du responsable du traitement : [À COMPLÉTER AVANT PUBLICATION]. Précisez le droit exercé et le compte concerné; des informations supplémentaires pourront être demandées pour vérifier votre identité. Le responsable doit répondre dans les délais prévus par le RGPD, en principe sous un mois.',
    },
    {
        title: 'Réclamation auprès de la CNIL',
        body: 'Si vous estimez, après avoir contacté le responsable, que vos droits ne sont pas respectés ou que votre demande reste sans réponse, vous pouvez déposer une plainte auprès de la CNIL via son formulaire : https://www.cnil.fr/fr/plaintes. Joignez les éléments utiles, notamment la demande adressée au responsable et sa réponse éventuelle.',
    },
];

export default function PrivacySettingsScreen() {
    return <SettingsInfoPage title="Confidentialité" sections={sections} reserveTabBarSpace />;
}